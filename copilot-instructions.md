# Plano de Desenvolvimento: Projeto de Jogos PWA

**Tech Stack:** Next.js, Supabase, Tailwind CSS, Vercel

**Legenda de Estado:**
* [ ] - Por Fazer
* [x] - Feito
* [-] - Em Progresso

---

## Fase 1: Fundação e Configuração do Projeto (Setup)

O objetivo é ter o projeto base a correr, com a base de dados ligada e o design minimalista iniciado.

* [ ] **Task 1.1: Configuração do Backend (Supabase)**
    * [ ] Criar conta e novo projeto no Supabase.
    * [ ] Desenhar o esquema da Base de Dados (criar tabelas iniciais):
        * [ ] Tabela `users` (vem com o Supabase Auth).
        * [ ] Tabela `profiles` (para guardar usernames, avatares, etc.).
        * [ ] Tabela `crossword_puzzles` (para guardar a estrutura dos puzzles, respostas, pistas).
        * [ ] Tabela `scores` (para as leaderboards: `user_id`, `puzzle_id`, `time_ms`, `created_at`).
    * [ ] Carregar a lista de palavras PT-PT (do dicionário LibreOffice) para uma nova tabela `dictionary_pt`.

* [ ] **Task 1.2: Configuração do Frontend (Next.js)**
    * [ ] Iniciar novo projeto Next.js (`npx create-next-app@latest`).
    * [ ] Instalar e configurar o Tailwind CSS.
    * [ ] Instalar o cliente do Supabase (`npm install @supabase/supabase-js`).
    * [ ] Configurar variáveis de ambiente (`.env.local`) com as chaves do Supabase.

* [ ] **Task 1.3: Design e UI Inicial**
    * [ ] Desenhar o layout principal (Navbar, Footer, área de conteúdo).
    * [ ] Criar a Homepage minimalista (apenas com o logo/título e seleção de jogo).
    * [ ] Criar a página "Sobre" e a página de "Login".

* [ ] **Task 1.4: Autenticação de Utilizadores**
    * [ ] Implementar o sistema de Login e Registo usando o Supabase Auth (ex: Login com Email/Password e/ou Google).
    * [ ] Criar a página de Perfil do utilizador (onde pode ver o seu username).

---

## Fase 2: Jogo Principal - Palavras Cruzadas (Singleplayer)

O objetivo é ter o jogo de palavras cruzadas totalmente funcional para um jogador.

* [ ] **Task 2.1: Lógica do Jogo (Core)**
    * [ ] Criar o componente React `<CrosswordGrid />` que renderiza a grelha.
    * [ ] Implementar a lógica de navegação na grelha (teclas de seta, clique).
    * [ ] Implementar a lógica de inserir/apagar letras.
    * [ ] Implementar a lógica de verificação (se a palavra/letra está correta).
    * [ ] Adicionar um cronómetro (timer) que começa quando o jogo inicia.
    * [ ] Adicionar um botão "Concluir" ou detetar automaticamente o fim do jogo.

* [ ] **Task 2.2: Integração de Dados**
    * [ ] Criar uma API Route em Next.js (ex: `/api/puzzle/[id]`) que vai buscar um puzzle específico ao Supabase.
    * [ ] Fazer a página do jogo consumir esta API para carregar o puzzle.

* [ ] **Task 2.3: Modo "Dicionário PT-PT"**
    * [ ] Criar uma API Route (ex: `/api/check-word`) que consulta a tabela `dictionary_pt` no Supabase.
    * *(Nota: Esta task pode ser mais complexa se o puzzle for gerado dinamicamente. Por agora, vamos assumir que os puzzles são pré-feitos).*

* [ ] **Task 2.4: Submissão de Pontuação**
    * [ ] Ao concluir o jogo, enviar o resultado (tempo) para a tabela `scores` no Supabase.
    * [ ] Mostrar um ecrã de "Jogo Concluído!" com o tempo final.

---

## Fase 3: Funcionalidades de Comunidade (Leaderboards)

O objetivo é implementar os modos de jogo competitivos e as leaderboards.

* [ ] **Task 3.1: Implementar Leaderboards**
    * [ ] Criar uma página `/leaderboards`.
    * [ ] A página deve fazer *query* à tabela `scores` do Supabase (agrupando por jogo/puzzle).
    * [ ] Mostrar o Top 10 de jogadores (username e tempo).
    * [ ] Adicionar filtros (ex: Diário, Puzzles específicos).

* [ ] **Task 3.2: Modo de Jogo "Diário"**
    * [ ] Criar uma lógica (ex: Tabela `daily_puzzle`) que define qual é o puzzle do dia.
    * [ ] Criar uma "Cron Job" (seja no Supabase ou Vercel) que corre à meia-noite e atualiza essa tabela.
    * [ ] A Homepage deve mostrar um link direto para o "Jogo Diário".
    * [ ] A leaderboard do Jogo Diário deve ser filtrada para o puzzle desse dia.

---

## Fase 4: Expansão (Novos Jogos e Multiplayer)

O objetivo é adicionar um novo tipo de jogo (Cartas) e introduzir o multiplayer.

* [ ] **Task 4.1: Jogo de Cartas (Base Singleplayer)**
    * [ ] Definir as regras do jogo (ex: Solitário, Sueca, etc.). Vamos assumir Solitário por ser simples.
    * [ ] Criar os componentes React (Carta, Baralho, Área de Jogo).
    * [ ] Implementar a lógica do jogo (arrastar e largar, regras de movimento).

* [ ] **Task 4.2: Conceito de "Salas" (Multiplayer)**
    * [ ] Atualizar o esquema da BD (Supabase) com uma tabela `game_rooms` (para jogos de cartas, ex: Sueca).
    * [ ] Criar uma UI para "Criar Sala" ou "Juntar-se a uma Sala".

* [ ] **Task 4.3: Implementar Real-Time (Multiplayer)**
    * [ ] Usar o Supabase Realtime (Subscriptions) na página do jogo.
    * [ ] Quando o Jogador 1 faz uma jogada (ex: joga uma carta), essa ação é escrita na BD.
    * [ ] Todos os outros jogadores na sala (subscritos a essa `game_room`) recebem a atualização em tempo real e o seu ecrã é atualizado.
    * [ ] Gerir o estado do jogo (ex: de quem é a vez de jogar).

---

## Fase 5: Finalização e Lançamento (PWA & Deploy)

O objetivo é otimizar o site e torná-lo instalável como uma App.

* [ ] **Task 5.1: Configuração PWA (Progressive Web App)**
    * [ ] Instalar e configurar o `next-pwa`.
    * [ ] Gerar os ficheiros `manifest.json` (com o nome da app, cores, ícones).
    * [ ] Criar os ícones da App (para iOS e Android).
    * [ ] Configurar o *service worker* para permitir o funcionamento offline (pelo menos da homepage).

* [ ] **Task 5.2: Otimização e Testes**
    * [ ] Testar a responsividade (Mobile, Tablet, Desktop).
    * [ ] Otimizar o carregamento das imagens e dos jogos.
    * [ ] Corrigir bugs encontrados.

* [ ] **Task 5.3: Deployment**
    * [ ] Criar um repositório no GitHub.
    * [ ] Criar uma conta na Vercel e ligar ao repositório.
    * [ ] Fazer o `git push` inicial para publicar o site.
    * [ ] Comprar um domínio (opcional) e configurá-lo na Vercel.