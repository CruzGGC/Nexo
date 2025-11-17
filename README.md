### Título do Projeto: "Nexo"

### Descrição Geral
O objetivo é desenvolver uma plataforma de jogos web, chamada "Nexo", que funcionará como uma **Progressive Web App (PWA)**. A plataforma deve ter uma **homepage minimalista** que sirva como um *launcher* para diferentes tipos de jogos. O primeiro jogo a ser implementado (MVP) será o de **Palavras Cruzadas**. O sistema deve ser expansível para incluir outros jogos no futuro, como **Jogos de Cartas**.

A plataforma deve suportar modos **singleplayer** e, quando aplicável (como nos jogos de cartas), **multiplayer**. Uma funcionalidade central será a existência de **leaderboards** (tabelas de classificação) opcionais, com um foco especial num modo de jogo "diário".

### Público-Alvo
Utilizadores casuais que procuram desafios mentais rápidos (palavras cruzadas) ou jogos sociais (cartas), com um elemento competitivo opcional e um foco na comunidade de língua portuguesa (Portugal).

### Requisitos Funcionais (Core Features)

**1. Plataforma e Design:**
* **PWA:** O site deve ser totalmente responsivo (mobile-first) e instalável num dispositivo móvel ou desktop, com capacidades offline básicas (ex: aceder à homepage).
* **UI Minimalista:** O design deve ser limpo, moderno e focado na usabilidade, seguindo a identidade visual (mockups e ícone "Nexo") já definidos. Deve suportar **Light Mode** e **Dark Mode**.

**2. Autenticação de Utilizadores:**
* A plataforma deve usar o **Supabase Auth**.
* Os utilizadores podem jogar anonimamente (singleplayer).
* Para submeter pontuações para as leaderboards ou jogar multiplayer, o registo/login é obrigatório.

**3. Jogo 1: Palavras Cruzadas (MVP)**
Esta é a funcionalidade inicial. Deve ter dois modos de jogo distintos:
* **Modo 1: Desafio Diário**
    * Um único puzzle de palavras cruzadas é disponibilizado a todos os jogadores por um período de 24 horas.
    * O objetivo é competir pelo **tempo mais rápido** de conclusão.
    * Deve existir uma leaderboard específica para este modo, que mostra o Top 10 de jogadores (utilizador e tempo em `mm:ss:ms`) para o dia corrente.
* **Modo 2: Dicionário PT-PT**
    * Um modo de jogo *on-demand* (singleplayer).
    * Os puzzles (pré-criados ou gerados) devem usar exclusivamente palavras válidas do **dicionário de Português de Portugal (PT-PT)**.
    * Uma lista de palavras PT-PT (ex: derivada dos dicionários open-source do LibreOffice) deve ser carregada para a base de dados para validação.

**4. Expansão Futura: Jogos de Cartas (Ex: Sueca, Solitário)**
* O sistema deve ser desenhado para permitir a adição fácil de novos jogos.
* Os jogos de cartas devem suportar:
    * **Singleplayer** (ex: Solitário).
    * **Multiplayer** (ex: Sueca), criando "salas" de jogo.

**5. Funcionalidade Multiplayer (Real-time):**
* Para os jogos multiplayer (como cartas), o estado do jogo deve ser sincronizado em tempo real entre todos os jogadores na sala.
* Isto será implementado usando as **Supabase Realtime Subscriptions**.
* Ex: Um jogador joga uma carta; essa ação é enviada para o Supabase, que notifica instantaneamente os outros jogadores na mesma "sala" para atualizarem o seu UI.

**6. Leaderboards Opcionais:**
* Além da leaderboard do "Desafio Diário", devem existir leaderboards gerais para outros puzzles ou jogos.
* As leaderboards devem estar ligadas aos perfis de utilizador (`profiles`).

### Requisitos Não-Funcionais (Tech Stack)

* **Framework Full-Stack:** **Next.js** (usando App Router).
* **Backend (BaaS):** **Supabase**.
    * **Base de Dados:** PostgreSQL (para guardar perfis, puzzles, pontuações, salas de jogo).
    * **Autenticação:** Supabase Auth (Email/Pass, Google, etc.).
    * **Real-time:** Supabase Realtime (para o multiplayer).
    * **Funções/Jobs:** Supabase Cron Jobs (para definir o "puzzle diário" à meia-noite).
* **Styling:** **Tailwind CSS**.
* **Deployment:** **Vercel**.

### Modelo de Dados Essencial (Tabelas Supabase)

1.  `profiles`:
    * `id` (UUID, FK para `auth.users`, Chave Primária)
    * `username` (text, unique)
    * `avatar_url` (text, opcional)

2.  `puzzles`:
    * `id` (serial, Chave Primária)
    * `type` (enum: 'daily', 'standard_pt')
    * `grid_data` (jsonb) - A estrutura da grelha.
    * `clues` (jsonb) - As pistas (horizontais e verticais).
    * `solutions` (jsonb) - As respostas.
    * `publish_date` (date, opcional, usado para 'daily')

3.  `scores`:
    * `id` (serial, Chave Primária)
    * `user_id` (UUID, FK para `profiles`)
    * `puzzle_id` (int, FK para `puzzles`)
    * `time_ms` (int) - Tempo de conclusão em milissegundos.
    * `created_at` (timestampz)

4.  `dictionary_pt`:
    * `word` (text, Chave Primária) - Lista de todas as palavras válidas de PT-PT.

5.  `game_rooms` (Para Multiplayer):
    * `id` (UUID, Chave Primária)
    * `game_type` (text, ex: 'sueca')
    * `players` (array de UUIDs, FKs para `profiles`)
    * `game_state` (jsonb) - O estado atual do jogo (cartas na mão, vez do jogador, etc.).
    * `status` (enum: 'waiting', 'in_progress', 'finished')

---

## 🚀 Como Fazer Deployment

Este projeto está pronto para deployment na **Vercel** (plano gratuito). Para instruções detalhadas de deployment, consultar **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

### Quick Start

1. **Configurar Supabase**
   ```bash
   # Criar projeto em supabase.com
   # Executar migrações no SQL Editor
   # Copiar Project URL e anon key
   ```

2. **Deploy na Vercel**
   ```bash
   # Via Dashboard (recomendado)
   # 1. Conectar repositório em vercel.com/new
   # 2. Adicionar environment variables
   # 3. Fazer deploy
   
   # Ou via CLI
   npm i -g vercel
   vercel
   ```

3. **Environment Variables Necessárias**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
    SUPABASE_SERVICE_ROLE_KEY=eyJ... (guardar apenas no servidor)
   ```

Ver **[DEPLOYMENT.md](./DEPLOYMENT.md)** para o guia completo de deployment, incluindo configuração de Edge Functions, cron jobs, e troubleshooting.

### Supabase Vault (Secrets para Cron / Edge Functions)

```sql
-- Executar no SQL Editor do projeto
create schema if not exists vault;
create extension if not exists supabase_vault with schema vault;

-- Guardar os secrets usados pelo `net.http_post`
select vault.create_secret('project_url', 'https://xxx.supabase.co');
select vault.create_secret('service_role_key', 'eyJ...');
```

> Sem estes secrets, os jobs `pg_cron` falham com `vault.get_secret` e as Edge Functions não são chamadas.