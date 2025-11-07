# Nexo - AI Coding Agent Instructions

## Project Overview
Nexo is a **Progressive Web App (PWA)** gaming platform focused on Portuguese (PT-PT) games. Built with Next.js 16, Supabase, and Tailwind CSS v4. Currently implementing crossword puzzles with plans to expand to card games.

**Current Phase:** Phase 2 - Crosswords Game (MVP nearly complete)  
**Target Architecture:** Minimalist launcher → Game pages → Leaderboards  
**Language:** Portuguese (PT-PT) with diacritics support (á, à, â, ã, é, ê, í, ó, ô, õ, ú, ç)

## Tech Stack & Configuration
- **Framework:** Next.js 16 (App Router, `app/` directory structure)
- **Styling:** Tailwind CSS v4 with `@tailwindcss/postcss` plugin
- **Backend:** Supabase (Auth, PostgreSQL, Realtime)
- **React:** v19.2.0 with `react-jsx` transform
- **TypeScript:** Strict mode, path alias `@/*` → project root
- **Fonts:** Geist Sans (UI) + Geist Mono (code/timers)

## Completed Infrastructure ✅

**Core Components:**
- `<CrosswordGrid />` - Full crossword logic with keyboard navigation, cell selection, and PT-PT character support
- `<Timer />` - Millisecond-precision timer (format: `mm:ss:ms`)
- Homepage with launcher cards and PT-PT language
- API routes: `/api/puzzle/[id]` (GET), `/api/scores` (GET/POST)

**Database:**
- Schema fully defined in `supabase/migrations/001_initial_schema.sql`
- TypeScript types in `lib/database.types.ts`
- Supabase client configured in `lib/supabase.ts` with auto-refresh tokens
- Tables: `profiles`, `puzzles`, `scores`, `dictionary_pt`, `game_rooms`

**Environment:**
- `.env.local` template ready (needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Development server working (`npm run dev`)

## Next Priority Tasks (Deployment Ready)
1. ✅ Run migrations: `002_add_definitions_to_dictionary.sql`, `003_schedule_daily_crossword.sql`
2. ✅ Populate dictionary: Execute `supabase/portuguese_words.sql` in Supabase SQL Editor
3. ✅ Create API endpoints: `/api/puzzle/daily` and `/api/puzzle/random`
4. ✅ Implement mode selection UI with both game modes
5. Deploy Edge Function: `supabase functions deploy generate-daily-crossword`
6. Store secrets in Vault: `project_url`, `service_role_key` (for cron authentication)
7. Test cron: Manually trigger function or wait until midnight Portugal time
8. Implement leaderboard page (`/leaderboards`) with Top 10 display (daily mode only)
9. Add authentication flow (Supabase Auth with Email/Google)
10. Deploy to Vercel with environment variables

## Critical Architecture Patterns

### Game Modes System ⭐
**Two distinct play modes for crosswords:**

**1. Daily Mode (`/api/puzzle/daily`):**
- Fetches today's puzzle from database (`type='daily'`, `publish_date=TODAY`)
- Portugal timezone aware (Europe/Lisbon)
- Same puzzle for all players globally
- Enables leaderboard competition
- Fallback to most recent puzzle if today's not yet generated
- Returns `isFromPreviousDay` flag when showing old puzzle

**2. Random Mode (`/api/puzzle/random`):**
- Generates NEW puzzle on every request
- Uses `CrosswordGenerator` with 100 random words from `dictionary_pt`
- NOT saved to database (stateless)
- Retry mechanism (5 attempts) for quality
- Perfect for practice/training
- No leaderboard (or personal only)

**UI Flow:**
```typescript
// Mode selection screen
showModeSelection → User picks → fetchPuzzle(mode)
  ├─ Daily: GET /api/puzzle/daily
  └─ Random: GET /api/puzzle/random

// Game screen shows mode badge
gameMode === 'daily' ? '📅 Diário' : '🎲 Aleatório'

// Completion screen
- Daily: "Ver Classificações" button
- Random: "Novo Puzzle Aleatório" button
```

**Implementation Details:**
- Mode stored in component state (`gameMode: 'daily' | 'random'`)
- Header shows active mode with icon badge
- "Mudar Modo" button returns to selection screen
- Restart behavior differs by mode (reload vs new generation)



### Automatic Daily Crossword Generation System ⭐
**Overview:** Fully automated system that generates a new crossword puzzle every day at midnight (Portugal timezone) using a curated list of Portuguese words.

**Components:**
1. **Dictionary (`dictionary_pt` table):**
   - Stores Portuguese words with definitions
   - Schema: `word TEXT PRIMARY KEY, definition TEXT`
   - Words filtered by length (3-10 characters) for crossword suitability
   - Expandable from 200 to 1000+ words

2. **Generator Algorithm (`lib/crossword-generator.ts`):**
   ```typescript
   class CrosswordGenerator {
     generate(words: WordEntry[], maxWords: number = 10)
     // 1. Filter words by length (3-10 chars)
     // 2. Place first word horizontally in center
     // 3. Find intersections for remaining words
     // 4. Trim grid and assign cell numbers
     // 5. Return {grid: Cell[][], clues: {across, down}}
   }
   ```
   - **Placement Logic:** Tries to intersect new words with placed words via common letters
   - **Grid Building:** 15x15 initial size, trimmed to content + padding
   - **Numbering:** Top-to-bottom, left-to-right sequential numbering
   - **Retry Mechanism:** Up to 5 generation attempts for quality

3. **Edge Function (`supabase/functions/generate-daily-crossword/index.ts`):**
   - Fetches 100 random words from `dictionary_pt`
   - Creates `CrosswordGenerator` instance
   - Generates puzzle (retries if needed)
   - Inserts into `puzzles` table with:
     - `type='daily'`
     - `publish_date=CURRENT_DATE` (Portugal timezone)
     - `grid_data=<generated grid>`
     - `clues=<generated clues>`

4. **Cron Scheduler (`migrations/003_schedule_daily_crossword.sql`):**
   ```sql
   SELECT cron.schedule(
     'generate-daily-crossword',
     '0 0 * * *', -- Midnight Portugal time
     $$SELECT net.http_post(...)$$ -- Triggers Edge Function
   );
   ```
   - Uses `pg_cron` + `pg_net` extensions
   - Authenticates with `service_role_key` from Vault
   - 60-second timeout for generation

**Data Flow:**
```
Midnight (Portugal) 
  → pg_cron triggers
  → net.http_post to Edge Function
  → Fetch 100 random words
  → CrosswordGenerator.generate()
  → Insert puzzle to DB
  → Users fetch via /api/puzzle endpoint
```

**Frontend Integration:**
```typescript
// Fetch today's daily puzzle
const { data: puzzle } = await supabase
  .from('puzzles')
  .select('*')
  .eq('type', 'daily')
  .order('publish_date', { ascending: false })
  .limit(1)
  .single();
```

**Deployment Checklist:**
- [ ] Run `002_add_definitions_to_dictionary.sql` migration
- [ ] Import words: `supabase/portuguese_words.sql`
- [ ] Deploy Edge Function: `supabase functions deploy generate-daily-crossword`
- [ ] Store in Vault: `project_url`, `service_role_key`
- [ ] Run `003_schedule_daily_crossword.sql` to activate cron
- [ ] Verify: Check `cron.job` table for scheduled job
- [ ] Test: Manually trigger or wait until midnight



### Crossword Game Logic (`components/CrosswordGrid.tsx`)
The crossword component implements a sophisticated keyboard-driven interface:

**State Management:**
- `grid`: 2D array of `Cell` objects with `{value, correct, number?, isBlack, row, col}`
- `selectedCell`: Current focus position `{row, col}`
- `direction`: Toggle between `'across'` | `'down'` (changes on Tab or re-click)
- `selectedClue`: Auto-computed from `selectedCell` + `direction`

**Keyboard Navigation:**
- **Arrow keys:** Move focus (auto-skips black cells, changes direction)
- **Tab:** Toggle direction without moving cell
- **Backspace:** Clear cell and move backwards
- **Letters:** Accept `[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ]` regex (PT-PT diacritics)
- Auto-advances after letter entry in current direction

**Completion Detection:**
- `checkComplete()` compares `cell.value.toUpperCase() === cell.correct.toUpperCase()` for all non-black cells
- Triggers `onComplete()` callback when puzzle solved

**UI Highlighting:**
- Yellow background for selected cell
- Light yellow for cells in current word (computed via `isCellInCurrentWord()`)
- Clue buttons highlight when their word is selected

### Timer Component (`components/Timer.tsx`)
**Implementation Details:**
- Uses `setInterval` with 10ms precision (not 1000ms!)
- Stores elapsed time in milliseconds
- Format: `mm:ss:ms` (e.g., "03:45:67")
- Callback `onTimeUpdate(timeMs)` fires every 10ms for real-time tracking
- Restarts from last value when `isRunning` changes (doesn't reset automatically)

### API Route Patterns

**GET `/api/puzzle/[id]`:**
```typescript
// Returns full puzzle object from Supabase
const { data: puzzle } = await supabase
  .from('puzzles')
  .select('*')
  .eq('id', id)
  .single();
```

**POST `/api/scores`:**
```typescript
// Validates user_id, puzzle_id, time_ms (must be > 0)
// Uses .insert().select().single() pattern for returning inserted row
```

**GET `/api/scores?puzzle_id=X`:**
```typescript
// Returns Top 10 with joined profile data
.select('*, profiles:user_id (username, avatar_url)')
.order('time_ms', { ascending: true })
.limit(10)
```

### Database Schema Key Details

**Puzzle Data Structure (JSONB columns):**
```typescript
grid_data: Cell[][]  // 2D array with isBlack flags
clues: { 
  across: Clue[],  // {number, text, answer, startRow, startCol, direction}
  down: Clue[] 
}
solutions: Json  // Currently unused (answers in grid_data.correct)
```

**Score Leaderboard Query:**
- Index on `scores(puzzle_id, time_ms)` for fast leaderboard lookups
- RLS policies: Public read, insert requires `auth.uid() = user_id`
- `time_ms` stored as `INTEGER` (milliseconds, not seconds!)

### Supabase Client Pattern
**Always use the singleton from `lib/supabase.ts`:**
```typescript
import { supabase } from '@/lib/supabase'
// Never create new clients in components/routes
```

**Error Handling Standard:**
```typescript
const { data, error } = await supabase.from('table').select()
if (error) {
  console.error('Context-specific message:', error)
  return NextResponse.json({ error: 'User-facing message' }, { status: 404|500 })
}
```




## Project-Specific Conventions

### File Organization Pattern
- `/app/page.tsx` - Homepage with launcher cards (see example: emoji icons, PT-PT descriptions)
- `/app/[game]/page.tsx` - Game pages (e.g., `/palavras-cruzadas/page.tsx` with timer + grid)
- `/app/api/[resource]/route.ts` - API routes using `NextResponse.json()`
- `/components/[Component].tsx` - Shared React components (use `'use client'` for state)
- `/lib/` - Utilities and Supabase client (no React hooks here)

### Styling Conventions
- **Mobile-first:** Always test responsive breakpoints (`sm:`, `lg:`)
- **Dark mode:** Every component uses `dark:` variant (e.g., `dark:bg-zinc-900`)
- **Spacing:** Use Tailwind's `gap-*` over margin in flex/grid layouts
- **Colors:** Zinc palette for neutrals, yellow for interactive highlights
- **Typography:** `font-sans` (Geist Sans) for UI, `font-mono` (Geist Mono) for timers/numbers

### TypeScript Patterns
- **No `any` types** except when Supabase types require casting (use `(supabase as any)` sparingly)
- **Import types with `type`:** `import type { Database } from '@/lib/database.types'`
- **Async params in route handlers (Next.js 16):**
  ```typescript
  export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params  // Must await!
  }
  ```

### Portuguese Language Requirements
- **All UI text** must be PT-PT (not PT-BR): "Pontuação" not "Pontuação", "Leaderboards" not "Rankings"
- **Crossword clues** use PT-PT vocabulary (see example puzzle: "CAFÉ", "FADO", "OLÁ")
- **Regex for input:** `/[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/` includes all PT-PT diacritics
- **Dictionary validation:** Use `dictionary_pt` table (lowercase normalized)

## Development Workflows

### Local Development Commands
```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build (validates TypeScript + ESLint)
npm run lint     # Run ESLint checks
npm start        # Production server (after npm run build)
```

### Environment Setup
Create `.env.local` with Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
**Warning:** App will throw error if these are missing (see `lib/supabase.ts` validation)

### Component Development Pattern
1. **Client components:** Add `'use client'` directive if using hooks or event handlers
2. **Server components:** Default in App Router, can fetch data directly (no useState/useEffect)
3. **Example flow for new game:**
   - Create `/app/[game-name]/page.tsx` (server component with metadata)
   - Create `/components/[GameName]Grid.tsx` (client component with game logic)
   - Add API route `/app/api/[game-name]/route.ts`

### Database Migration Workflow
1. Edit SQL in `supabase/migrations/` directory
2. Run migration via Supabase dashboard SQL editor
3. Regenerate types: `npx supabase gen types typescript --project-id <id> > lib/database.types.ts`
4. Commit both migration and updated types

## Key Integration Points

### Example Puzzle Structure (see `/app/palavras-cruzadas/page.tsx`)
```typescript
const grid: Cell[][] = [
  [
    { value: '', correct: 'C', number: 1, isBlack: false, row: 0, col: 0 },
    { value: '', correct: 'A', isBlack: false, row: 0, col: 1 },
    // ...
  ]
]

const clues = {
  across: [
    { number: 1, text: 'Habitação, moradia', answer: 'CASA', 
      startRow: 0, startCol: 0, direction: 'across' }
  ],
  down: [...]
}
```

### Daily Challenge Implementation ✅ AUTOMATED
**Automatic Crossword Generation System:**
- **Cron Job:** `pg_cron` executes at **00:00 Portugal time** (see `migrations/003_schedule_daily_crossword.sql`)
- **Edge Function:** `supabase/functions/generate-daily-crossword/index.ts` generates puzzle
- **Algorithm:** `lib/crossword-generator.ts` - Crossword placement logic
- **Word Source:** `dictionary_pt` table with `word` + `definition` columns (~200+ words, expandable to 1000+)
- **Generation Flow:**
  1. Cron triggers Edge Function at midnight
  2. Function fetches 100 random words from `dictionary_pt`
  3. `CrosswordGenerator` creates 15x15 grid with 8-12 intersecting words
  4. Puzzle inserted with `type='daily'` and `publish_date=TODAY`
  5. Frontend fetches latest daily puzzle via `WHERE type='daily' ORDER BY publish_date DESC LIMIT 1`

**Key Algorithm Features:**
- Words must be 3-10 characters
- First word placed horizontally in center
- Subsequent words find intersections (common letters)
- Grid trimmed to minimum size + 1 cell padding
- Cells numbered top-to-bottom, left-to-right
- Retries up to 5 times if generation fails

**Leaderboard:** Filter scores by `puzzle_id` of daily puzzle, order by `time_ms ASC`

### Portuguese Dictionary Integration ✅ IMPLEMENTED
- **Source:** Manual curation + LibreOffice PT-PT word list (open-source)
- **Storage:** `dictionary_pt` table with columns:
  - `word TEXT PRIMARY KEY` - Lowercase normalized word (3-10 chars)
  - `definition TEXT` - Crossword clue (e.g., "Bebida estimulante escura" for "café")
- **Initial Data:** `supabase/portuguese_words.sql` (~200 words with definitions)
- **Expansion:** Add more words with same INSERT format, target 1000+ for variety
- **Query Pattern:** `SELECT word, definition FROM dictionary_pt WHERE length(word) BETWEEN 3 AND 10 ORDER BY random() LIMIT 100`
- **Validation endpoint (future):** `GET /api/check-word?word=palavra` queries this table

### Authentication Flow (Planned - Phase 3)
- **Anonymous play:** Allow without login (local state only, no leaderboard submission)
- **Sign-in required for:** Score submission, multiplayer games
- **Providers:** Supabase Auth with Email/Password + Google OAuth
- **Profile creation:** Auto-create `profiles` row via Supabase trigger on `auth.users` insert

### Multiplayer Real-time (Planned - Phase 4)
- **Subscribe to game room:** `supabase.channel('room:uuid').on('postgres_changes'...)`
- **Broadcast moves:** Update `game_rooms.game_state` JSONB column
- **UI sync:** All players receive update via Realtime subscription, re-render game state

## Common Pitfalls to Avoid
- **Async params:** Next.js 16 requires `await params` in route handlers - don't destructure directly
- **Supabase types:** Use `(supabase as any)` only when TypeScript can't infer `.insert().select().single()` chain
- **PT-PT vs PT-BR:** Use "Horizontais/Verticais" not "Horizontal/Vertical", "Leaderboards" not "Classificações"
- **Timer precision:** Store `time_ms` as INTEGER milliseconds, not seconds - critical for leaderboard sorting
- **Cell navigation:** Always skip black cells in arrow key handlers (see `moveHorizontal/moveVertical` helpers)
- **Grid mutations:** Always create new arrays with spread `[...grid]` - don't mutate state directly
- **Completion check:** Run in `setTimeout(() => checkComplete(), 100)` to ensure state update completes

## Testing & Deployment
- **Local testing:** Run `npm run build` before deploying to catch type/lint errors
- **Environment variables:** Configure in Vercel dashboard under Settings → Environment Variables
- **Preview deploys:** Every push to non-main branches creates preview URL
- **Production:** Push to `main` branch triggers auto-deployment
- **Mobile testing:** Use Chrome DevTools device emulation + real iOS Safari/Android Chrome

## Documentation References
- **Project spec:** `/README.md` (full requirements in Portuguese)
- **Example puzzles:** `supabase/example_puzzles.sql` (SQL INSERT statements)
- **Database schema:** `supabase/migrations/001_initial_schema.sql` (complete with RLS policies)
- **Supabase docs:** https://supabase.com/docs (Auth, Realtime, RLS)
- **Next.js App Router:** https://nextjs.org/docs/app (dynamic routes, server components)
