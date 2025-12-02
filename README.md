# 🎮 Nexo - Plataforma de Jogos Portugueses

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**Uma Progressive Web App moderna de jogos clássicos em Português de Portugal.**

[Demo ao Vivo](nexo-puce.vercel.app) · [Reportar Bug](https://github.com/CruzGGC/Nexo/issues) · [Sugerir Funcionalidade](https://github.com/CruzGGC/Nexo/issues)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Jogos Disponíveis](#-jogos-disponíveis)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Sistema de Matchmaking](#-sistema-de-matchmaking)
- [Sistema de Rating](#-sistema-de-rating)
- [Segurança](#-segurança)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **Nexo** é uma plataforma web moderna que oferece uma coleção de jogos clássicos adaptados para Português de Portugal (PT-PT). Desenvolvido como uma PWA (Progressive Web App), o Nexo proporciona uma experiência de jogo fluída tanto em desktop como em dispositivos móveis, com suporte offline e instalação nativa.

### Destaques

- 🇵🇹 **100% em Português de Portugal** - Interface, pistas e dicionário completo em PT-PT
- 📱 **PWA Completa** - Instalável, funciona offline, notificações push
- 🎨 **Design Cyberpunk** - Estética dark com glassmorphism e animações fluídas
- 🏆 **Sistema Competitivo** - Leaderboards, sistema de rating Glicko-2, matchmaking inteligente
- 🔒 **Autenticação Flexível** - Joga como convidado ou cria conta para guardar progresso
- ⚡ **Performance Otimizada** - Server Components, Edge Functions, caching inteligente

---

## ✨ Funcionalidades

### Modos de Jogo

| Modo | Descrição |
|------|-----------|
| 📅 **Diário** | Puzzle único para todos os jogadores, renovado diariamente à meia-noite (hora de Lisboa) |
| 🎲 **Aleatório** | Puzzles gerados dinamicamente por categoria temática |
| ⚔️ **Duelo 1v1** | Competição em tempo real contra outro jogador |
| 🏠 **Local** | Partidas no mesmo dispositivo (ideal para jogos de tabuleiro) |

### Sistema de Utilizadores

- **Autenticação Anónima** - Joga instantaneamente sem criar conta
- **Loginaaaaaaaaaaaaaaaaa** - Sincroniza progresso entre dispositivos
- **Perfis Públicos** - Display name, avatar, país e estatísticas
- **Sistema de XP** - Experiência acumulada por completar puzzles
- **Badges e Conquistas** - Reconhecimento por feitos especiais

### Características Técnicas

- ⌨️ **Navegação por Teclado** - Suporte completo a setas, Tab, Backspace
- 📲 **Touch Optimizado** - Gestos intuitivos para seleção de palavras
- 🌙 **Modo Escuro Nativo** - Design otimizado para ambientes escuros
- 🔄 **Tempo Real** - Atualizações via Supabase Realtime
- 💾 **Offline First** - Service Worker com cache inteligente

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 (App Router)               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐    │   │
│  │  │   Pages     │ │  Components │ │   API Routes    │    │   │
│  │  │  (Server)   │ │  (Client)   │ │  (Edge/Node)    │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Service Worker                        │   │
│  │         Offline Cache • Push Notifications               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (Supabase)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │  PostgreSQL  │ │     Auth     │ │    Edge Functions    │    │
│  │   + RLS      │ │  (Anon+JWT)  │ │  (Deno/TypeScript)   │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │   Realtime   │ │   Storage    │ │      pg_cron         │    │
│  │  (WebSocket) │ │  (Avatares)  │ │  (Daily Generation)  │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologias

### Core

| Tecnologia | Versão | Utilização |
|------------|--------|------------|
| [Next.js](https://nextjs.org/) | 16.0.1 | Framework React com App Router |
| [React](https://react.dev/) | 19.2.0 | Biblioteca de UI com Server Components |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipagem estática rigorosa |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Styling utility-first |
| [Supabase](https://supabase.com/) | 2.80+ | Backend-as-a-Service |

### Bibliotecas Principais

| Biblioteca | Utilização |
|------------|------------|
| [Framer Motion](https://www.framer.com/motion/) | Animações e transições |
| [Lucide React](https://lucide.dev/) | Iconografia consistente |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | Gestão de classes CSS |

### Base de Dados

- **PostgreSQL 15** via Supabase
- **Row Level Security (RLS)** em todas as tabelas
- **pg_cron** para tarefas agendadas
- **pg_net** para webhooks HTTP
- **pgcrypto** para geração segura de tokens

---

## 🎮 Jogos Disponíveis

### 1. Palavras Cruzadas 📝

Puzzles de palavras cruzadas gerados automaticamente com vocabulário português.

**Características:**
- Gerador algorítmico com métricas de qualidade (interseções, densidade)
- Dicionário de 200+ palavras com definições
- Categorias temáticas (Animais, Comida, Geografia, etc.)
- Timer de precisão milissegundos
- Validação em tempo real com destaque de erros
- Modo duelo 1v1 com progresso sincronizado

### 2. Sopa de Letras 🔍

Encontra palavras escondidas numa grelha de letras.

**Características:**
- 8 direções possíveis (horizontal, vertical, diagonal)
- Sistema de dicas com destaque de células
- Seleção por arrastar (touch-friendly)
- Animações de descoberta
- Categorias por dificuldade

### 3. Batalha Naval ⚓

O clássico jogo de estratégia naval.

**Características:**
- Modo local (2 jogadores no mesmo dispositivo)
- Modo online com matchmaking
- Colocação manual ou automática da frota
- Animações de tiros e explosões
- Sistema de turnos em tempo real

### 4. Jogo do Galo ❌⭕

Três em linha com sistema de séries.

**Características:**
- Melhor de 5 (primeiro a 3 vitórias)
- IA local (em desenvolvimento)
- Matchmaking online
- Deteção automática de vitória/empate

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** 10.x ou superior (ou pnpm/yarn)
- **Conta Supabase** (gratuita disponível)

### Passos

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/CruzGGC/Nexo.git
   cd Nexo
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```

4. **Iniciar servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Abrir no browser**
   ```
   http://localhost:3000
   ```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Criar ficheiro `.env.local` na raiz do projeto:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Configurar Supabase

1. **Criar projeto** em [supabase.com](https://supabase.com)

2. **Executar migrações** no SQL Editor:
   ```sql
   -- Executar na ordem:
   -- 1. supabase/migrations/001_schema_principal.sql
   -- 2. supabase/migrations/002_dados_iniciais.sql
   -- 3. supabase/migrations/003_dados_continuacao.sql
   -- 4. supabase/migrations/004_cron_jobs.sql
   -- 5. supabase/migrations/005_matchmaking_rpc.sql
   ```

3. **Configurar autenticação** (Dashboard → Authentication):
   - Ativar "Anonymous Sign-ins"
   - Definir Site URL e Redirect URLs

4. **Deploy Edge Functions** (para geração diária):
   ```bash
   supabase functions deploy generate-daily-crossword
   supabase functions deploy generate-daily-wordsearch
   ```

---

## 📁 Estrutura do Projeto

```
nexo/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── layout.tsx                # Root layout com providers
│   ├── manifest.ts               # PWA manifest
│   ├── globals.css               # Estilos globais + Tailwind
│   ├── api/                      # API Routes
│   │   ├── crossword/            # Endpoints de palavras cruzadas
│   │   ├── wordsearch/           # Endpoints de sopa de letras
│   │   ├── leaderboards/         # Rankings e classificações
│   │   ├── scores/               # Submissão de pontuações
│   │   └── categories/           # Categorias temáticas
│   ├── auth/                     # Páginas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/
│   ├── batalha-naval/            # Jogo Batalha Naval
│   ├── jogo-do-galo/             # Jogo do Galo
│   ├── palavras-cruzadas/        # Palavras Cruzadas
│   ├── sopa-de-letras/           # Sopa de Letras
│   ├── leaderboards/             # Hall da Fama
│   └── profile/                  # Perfil do utilizador
│
├── components/                   # Componentes React
│   ├── CrosswordGrid.tsx         # Grelha interativa de palavras cruzadas
│   ├── WordSearchGrid.tsx        # Grelha de sopa de letras
│   ├── BattleshipGame.tsx        # Lógica completa de Batalha Naval
│   ├── TicTacToeGame.tsx         # Jogo do Galo com séries
│   ├── Timer.tsx                 # Cronómetro de precisão
│   ├── AuthProvider.tsx          # Contexto de autenticação
│   ├── Navbar.tsx                # Navegação principal
│   ├── GameCard.tsx              # Cartão de jogo 3D
│   ├── battleship/               # Subcomponentes Batalha Naval
│   ├── crossword/                # Subcomponentes Palavras Cruzadas
│   ├── tictactoe/                # Subcomponentes Jogo do Galo
│   ├── wordsearch/               # Subcomponentes Sopa de Letras
│   └── pwa/                      # Componentes PWA
│
├── hooks/                        # Custom React Hooks
│   ├── useMatchmaking.ts         # Gestão de fila e matchmaking
│   ├── useCrosswordGame.ts       # Estado do jogo de palavras cruzadas
│   ├── useBattleshipBoards.ts    # Estado das grelhas de Batalha Naval
│   ├── useScoreSubmission.ts     # Submissão de pontuações
│   └── usePlayerRating.ts        # Rating e estatísticas
│
├── lib/                          # Utilitários e configuração
│   ├── supabase.ts               # Cliente Supabase singleton
│   ├── supabase-browser.ts       # Cliente para browser
│   ├── supabase-server.ts        # Cliente para Server Components
│   ├── database.types.ts         # Tipos gerados da DB
│   ├── crossword-generator.ts    # Gerador de puzzles
│   ├── wordsearch-generator.ts   # Gerador de sopa de letras
│   ├── matchmaking.ts            # Utilitários de matchmaking
│   ├── rating-system.ts          # Sistema Glicko-2
│   ├── api-client.ts             # Wrapper fetch com tipos
│   └── types/                    # Definições TypeScript
│
├── supabase/                     # Configuração Supabase
│   ├── migrations/               # Ficheiros SQL de migração
│   │   ├── 001_schema_principal.sql
│   │   ├── 002_dados_iniciais.sql
│   │   └── ...
│   └── functions/                # Edge Functions (Deno)
│       ├── generate-daily-crossword/
│       └── generate-daily-wordsearch/
│
├── public/                       # Ficheiros estáticos
│   ├── sw.js                     # Service Worker
│   ├── offline.html              # Página offline
│   └── icons/                    # Ícones PWA
│
├── scripts/                      # Scripts de utilidade
│   ├── validate-deployment.sh    # Validação pré-deploy
│   └── generate-icons.sh         # Geração de ícones
│
└── docs/                         # Documentação adicional
    └── auth-and-matchmaking.md   # Guia de autenticação
```

---

## 🔌 API Endpoints

### Palavras Cruzadas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/crossword/daily` | Puzzle diário (Portugal timezone) |
| `GET` | `/api/crossword/random?category=animais` | Puzzle aleatório por categoria |
| `GET` | `/api/crossword/[id]` | Puzzle específico por ID |
| `POST` | `/api/crossword/duel/create` | Criar puzzle para duelo |

### Sopa de Letras

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/wordsearch/daily` | Puzzle diário |
| `GET` | `/api/wordsearch/random?category=comida` | Puzzle aleatório |

### Leaderboards

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/leaderboards?type=crossword` | Top jogadores de palavras cruzadas |
| `GET` | `/api/leaderboards?type=wordsearch` | Top jogadores de sopa de letras |
| `GET` | `/api/leaderboards?type=ratings` | Ranking global por Elo |

### Pontuações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/scores` | Submeter pontuação |
| `GET` | `/api/scores?puzzle_id=uuid` | Top 10 de um puzzle |

### Categorias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/categories` | Lista de categorias com contagem de palavras |

---

## 🎯 Sistema de Matchmaking

### Fluxo de Matchmaking Público

```
1. Jogador entra na fila
   └─ INSERT matchmaking_queue (status='queued')

2. RPC procura par compatível
   └─ Ordenar por rating_snapshot, skill_bracket, region

3. Match encontrado
   └─ UPDATE ambos para status='matched'
   └─ INSERT game_rooms

4. Sincronização via Realtime
   └─ supabase.channel('room:<id>').subscribe()
```

### Buckets de Habilidade

| Rating Elo | Bracket | Cor |
|------------|---------|-----|
| < 1100 | Bronze 🥉 | #CD7F32 |
| 1100-1399 | Prata 🥈 | #C0C0C0 |
| 1400-1599 | Ouro 🥇 | #FFD700 |
| 1600-1899 | Platina 💎 | #00D4FF |
| ≥ 1900 | Diamante 💠 | #B9F2FF |

### Partidas Privadas

- Gerar código com `generateMatchCode(6)`
- Host: `joinQueue({ mode: 'private', matchCode, seat: 'host' })`
- Guest: `joinQueue({ mode: 'private', matchCode, seat: 'guest' })`

---

## 📊 Sistema de Rating

O Nexo utiliza o algoritmo **Glicko-2** para calcular ratings competitivos.

### Parâmetros

| Parâmetro | Valor Padrão | Descrição |
|-----------|--------------|-----------|
| Rating Inicial | 1500 | Ponto de partida |
| Deviation (RD) | 350 | Incerteza inicial |
| Volatility | 0.06 | Taxa de mudança |
| τ (Tau) | 0.5 | Constante do sistema |

### Ranks

| Rank | Rating Mínimo | Ícone |
|------|---------------|-------|
| Bronze | 0 | 🥉 |
| Prata | 1200 | 🥈 |
| Ouro | 1400 | 🥇 |
| Platina | 1600 | 💎 |
| Diamante | 1800 | 💠 |
| Mestre | 2000 | 👑 |
| Grão-Mestre | 2200 | ⭐ |
| Lenda | 2500 | 🌟 |

---

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS ativas:

```sql
-- Exemplo: Apenas o próprio utilizador pode ver o seu perfil completo
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Utilizadores anónimos não podem submeter para leaderboards globais
CREATE POLICY "Only verified users can submit scores"
  ON scores FOR INSERT
  WITH CHECK ((auth.jwt()->>'is_anonymous')::boolean IS FALSE);
```

### Headers de Segurança

```typescript
// next.config.ts
{
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### Autenticação

- **JWT com auto-refresh** configurado no cliente Supabase
- **Sessões persistentes** via `localStorage`
- **Anon keys** apenas no frontend (não expõem dados sensíveis)
- **Service role** apenas em Edge Functions protegidas

---

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositório** em [vercel.com](https://vercel.com)

2. **Configurar variáveis de ambiente**:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Configurar região** (Frankfurt recomendado para PT):
   ```json
   // vercel.json
   { "regions": ["fra1"] }
   ```

4. **Deploy automático** em cada push para `main`

### Validação Pré-Deploy

```bash
npm run validate
# ou
bash scripts/validate-deployment.sh
```

---

## 🗺️ Roadmap

### ✅ Concluído

- [x] Palavras Cruzadas (diário, aleatório, categorias)
- [x] Sopa de Letras (diário, aleatório)
- [x] Batalha Naval (local e online)
- [x] Jogo do Galo (local e online com séries)
- [x] Sistema de autenticação híbrido
- [x] Leaderboards globais
- [x] PWA completa
- [x] Design system cyberpunk

### 🔄 Em Progresso

- [ ] Duelos 1v1 em tempo real
- [ ] Sistema de conquistas
- [ ] Perfis públicos com estatísticas

### 📋 Planeado

- [ ] Modo torneio
- [ ] Sistema de amigos
- [ ] Chat in-game
- [ ] Suporte a mais idiomas
- [ ] App nativa (React Native)
- [ ] Integração com Discord

---

## 🤝 Contribuir

Contribuições são bem-vindas! Por favor, lê o nosso guia de contribuição.

### Como Contribuir

1. **Fork** do repositório
2. **Criar branch** (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** das alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para o branch (`git push origin feature/nova-funcionalidade`)
5. **Abrir Pull Request**

### Código de Conduta

- Mantém respeito e profissionalismo
- Escreve código limpo e documentado
- Segue as convenções existentes
- Testa antes de submeter

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## 👏 Agradecimentos

- [Supabase](https://supabase.com) - Backend infrastructure
- [Vercel](https://vercel.com) - Hosting e CDN
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide](https://lucide.dev) - Icon library

---

<div align="center">

Feito com ❤️ em Portugal

**[⬆ Voltar ao topo](#-nexo---plataforma-de-jogos-portugueses)**

</div>
