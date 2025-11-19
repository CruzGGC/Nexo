# Autenticação Opcional, Perfis e Matchmaking

## Objetivos
- Permitir que *todos* joguem imediatamente como convidados usando **Supabase Anonymous Sign-Ins**.
- Oferecer vantagens claras para contas verificadas: XP persistente, leaderboards globais, Elo, lista de amigos e historial.
- Preparar a infraestrutura de matchmaking para futuros jogos como Tic Tac Toe e Batalha Naval.

## Fluxo de Autenticação Híbrido
1. **Entrada anónima**
   - No cliente, usa `supabase.auth.signInAnonymously()` para gerar um `auth.users` com `is_anonymous = true` (ver [Supabase Anonymous Sign-Ins · Abr 2024](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-anonymous.mdx)).
   - A trigger `create_profile_for_new_user` preenche `profiles` com `display_name`, `guest_tag`, `country_code` e `preferences` a partir de `raw_user_meta_data`.
2. **Promoção para conta permanente**
   - Para OAuth usa `supabase.auth.linkIdentity({ provider: 'google' })` (mesmo artigo) mantendo `user_id` e XP.
   - Para email/telefone utiliza `supabase.auth.updateUser({ email })` seguido de `updateUser({ password })` após a verificação.
3. **RLS consciente do modo convidado**
   - As políticas podem verificar `((auth.jwt()->>'is_anonymous')::boolean)` para restringir ações sensíveis (ex. criação de posts), conforme o snippet oficial:
     ```sql
     create policy "Only permanent users can create posts"
       on public.posts for insert to authenticated
       with check ((select auth.jwt()->>'is_anonymous')::boolean is false);
     ```
   - Leaderboards continuam públicos; apenas ações que alteram Elo ou inventário exigem conta permanente.

## Perfis Ampliados (Tabela `profiles`)
- **Novos campos**: `display_name`, `guest_tag`, `country_code`, `experience_points`, `is_anonymous`, `preferences`, `last_seen`.
- **Geração automática**: `guest_tag` via `pgcrypto` (`encode(gen_random_bytes(3), 'hex')`).
- **XP e preferências** guardados no mesmo registo para simplificar o HUD.

## Leaderboards & Elo
- As views `leaderboard_crosswords` e `leaderboard_wordsearches` exibem agora `display_name`.
- A nova tabela `player_ratings` guarda Elo/Glicko por `game_type` com `rating`, `deviation`, `volatility`, `win_rate` e `matches_played`.
- A view `leaderboard_player_ratings` fornece o ranking global para o endpoint `/api/leaderboards?type=ratings`.
- **Fluxo de atualização** recomendado:
  1. Edge Function recebe resultado final.
  2. Calcula Glicko e executa `UPDATE player_ratings ... WHERE user_id = ... AND game_type = ...` com `service_role` (ignora RLS) ou chama uma RPC `update_rating()`.
  3. Insere histórico opcional numa tabela `matches` (próximo passo).

## Matchmaking
- Nova tabela `matchmaking_queue` preserva as entradas da fila: `game_type`, `rating_snapshot`, `skill_bracket`, `region`, `status` e `metadata` (ex. regras da partida).
- Políticas de RLS asseguram que o próprio jogador pode criar/atualizar/remover a entrada.
- Índices (`idx_queue_status_game`) permitem procurar rapidamente por jogadores na mesma região/bucket.
- O serviço de matchmaking deve:
  1. Inserir o jogador (`status = 'queued'`).
  2. Procurar pares compatíveis ordenando por `rating_snapshot` e `joined_at`.
  3. Atualizar ambos para `status = 'matched'` e criar um registo em `game_rooms`.

### Trabalhador de Matchmaking (Edge Function)
- **Entrada**: HTTP POST autenticado via `Authorization: Bearer <cron-secret>` ou chamada direta do painel; corpo opcional `{ "gameType": "tic_tac_toe" }`.
- **Saída**: JSON com métricas da execução (`matchesCreated`, `queueProcessed`, `warnings`).
- **Fluxo**:
  1. Busca até 100 entradas `status = 'queued'` para o `game_type` solicitado ordenadas por `joined_at`.
  2. Agrupa por `region` (ou `global` quando `NULL`) e `skill_bracket` usando os intervalos abaixo.
  3. Emparelha pares sequenciais dentro do mesmo bucket; se alguém aguarda > 45s o worker tenta combinar com buckets adjacentes, e após 90s ignora o bucket/region para evitar espera infinita.
  4. Para cada par gera `game_rooms` com `max_players = 2`, `status = 'waiting'`, `host_id` = primeiro jogador, `puzzle_id = gen_random_uuid()` e estado inicial:
     ```json
     {
       "board": ["", "", "", "", "", "", "", "", ""],
       "participants": [
         {"user_id": "uuid-1", "symbol": "X", "joined_at": "..."},
         {"user_id": "uuid-2", "symbol": "O", "joined_at": "..."}
       ],
       "turn": "uuid-1",
       "moves": []
     }
     ```
  5. Atualiza ambos os registos da fila para `status = 'matched'`, preenche `matched_at` e coloca `metadata.room_id` para permitir que o cliente faça subscribe ao canal Realtime.
- **Buckets de habilidade** (aplicados automaticamente quando a entrada é criada):

| Faixa Elo | `skill_bracket` |
|-----------|-----------------|
| `< 1100`  | `bronze`        |
| `1100-1399` | `prata`       |
| `1400-1599` | `ouro`        |
| `1600-1899` | `platina`     |
| `>= 1900` | `diamante`     |

- **Falhas**: caso algum `UPDATE`/`INSERT` falhe, o RPC devolve `status='queued'` e o cliente mantém a presença ativa até tentar novamente. Qualquer limpeza adicional ocorre via cron de manutenção (remoção de filas antigas) e não depende mais de um worker dedicado.

### Multiplayer Battleship
- **Game type**: `battleship` (10x10). `game_state` guarda duas grelhas por jogador (`ocean` e `tracking`) e um objeto `ships` com vida atual.
- **Fases**: `placement` (host dispõe frota ou aceita disposição automática) → `attack` (turnos alternados) → `finished`.
- **Match codes**: `metadata.matchCode` permite criar partidas privadas; o worker só cruza entradas cujo `matchCode` coincide.
- **Realtime payload**: `game_state.moves` é um array com `{ shooter_id, target, result }` para sincronizar tiros em tempo real. `metadata.room_code` (6 chars) é devolvido ao cliente para partilha.

### Duelos 1v1 (Palavras Cruzadas & Sopa de Letras)
- Novos `game_type`: `crossword_duel` e `wordsearch_duel` (mantemos puzzles regulares, mas com contagem cooperativa).
- **Seleção de puzzle**: o Edge Function escolhe a puzzle diária mais recente (`type='daily'`) ou gera uma aleatória e coloca `game_state.puzzle` com `puzzle_id` + `mode`.
- **Critério de vitória**: `game_state.progress[player_id]` acompanha percentagem preenchida; quando alguém atinge `100`, o worker marca `status='finished'` e preenche `winner_id`.
- **Private codes**: mesmos campos `metadata.matchCode` + `metadata.room_code`. Clientes conseguem criar/entrar numa partida privada e partilhar via UI.
- **Eventos Realtime (roadmap)**: canal `duel:<room_id>` transmite `UPDATE game_rooms SET game_state = ...` com throttling de 1 segundo.

## Integração no Frontend
- `/app/leaderboards/page.tsx` consome `/api/leaderboards` e mostra:
  - Top 10 diários (Crossword & Sopa).
  - Ranking Elo filtrável (`player_ratings`).
- Componentes usam mensagens em PT-PT e reforçam o benefício do login.
- O **AuthProvider** (`components/AuthProvider.tsx`) partilha sessão/Perfil em todas as páginas. O cliente usa `supabase.auth.signInAnonymously()` e `auth.linkIdentity({ provider: 'google' })` conforme a documentação oficial de abril/2024.
- `components/AuthCallout.tsx` mostra o estado (convidado vs permanente), XP, CTA para ligar conta Google (apenas se `user.is_anonymous === true`) e um botão para terminar sessão.
- O layout global (`app/layout.tsx`) envolve a aplicação no novo `<Providers>` para disponibilizar `useAuth()` a qualquer componente client-side.
- A rota `/auth/callback` serve como destino default para `redirectTo` quando o utilizador conclui OAuth.

## Próximos Passos
1. **RPC de atualização de Elo**: encapsular o cálculo numa função `update_player_rating(match_id UUID, payload JSONB)` com `SECURITY DEFINER`.
2. **Histórico de Partidas**: tabela `matches` + `match_participants` para auditoria e estatísticas.
3. **Lista de Amigos/Follows**: tabela `friendships` para convites rápidos e partilha de salas.
4. **Integração Realtime**: canais `matchmaking:*` para refletir estado da fila no cliente.
5. **UI de Conta**: permitir ao convidado personalizar `display_name` mesmo antes de ligar uma conta.
6. **Configurações**: expor painel rápido para alterar avatar preferido e sincronizar `preferences`.

Seguindo estas etapas, mantemos o onboarding sem fricção, preservamos dados para futuros upgrades e abrimos caminho para matchmaking competitivo sustentado por Elo.
