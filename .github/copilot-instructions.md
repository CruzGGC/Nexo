# Nexo - AI Coding Agent Instructions

## Project Overview
Nexo is a **Progressive Web App (PWA)** gaming platform focused on Portuguese (PT-PT) games, starting with crosswords and expanding to card games. The project is in **Phase 1 (Setup)** - only the Next.js skeleton exists currently.

**Target Architecture:** Minimalist launcher homepage → Individual game pages → Leaderboards  
**Language Focus:** Portuguese (PT-PT) dictionary integration required  
**Key Feature:** Daily challenge mode with real-time leaderboards

## Tech Stack & Configuration
- **Framework:** Next.js 16 with App Router (`app/` directory)
- **Styling:** Tailwind CSS v4 (with PostCSS plugin `@tailwindcss/postcss`)
- **Backend (Planned):** Supabase (Auth, PostgreSQL, Realtime)
- **Deployment:** Vercel
- **React:** v19.2.0 with new `react-jsx` transform
- **TypeScript:** Strict mode enabled, path alias `@/*` for project root

## Critical Development Context

### Current State (Phase 1 - Foundation) ✅ COMPLETE

The project foundation is **fully implemented** with all core infrastructure ready. The homepage, database schema, TypeScript types, and Supabase integration are complete and tested.

**✅ Completed:**
- Supabase JS client installed and configured
- Database schema created (`supabase/migrations/001_initial_schema.sql`)
- TypeScript types for all tables (`lib/database.types.ts`)
- Minimalist homepage with PT-PT language
- Placeholder pages for all routes
- Environment variables template
- Development server running successfully

**Next Priority Tasks (Phase 2 - Crosswords Game):**
1. Create `<CrosswordGrid />` component with game logic
2. Implement timer functionality (start to completion tracking)
3. Build API route `/api/puzzle/[id]` to fetch puzzles from Supabase
4. Build API route `/api/scores` to submit scores
5. Update `/palavras-cruzadas/page.tsx` with game UI

### Essential Database Schema (To Be Created)
```sql
profiles (id, username, avatar_url)
puzzles (id, type, grid_data, clues, solutions, publish_date)
scores (id, user_id, puzzle_id, time_ms, created_at)
dictionary_pt (word) -- PT-PT word list from LibreOffice dictionaries
game_rooms (id, game_type, players, game_state, status) -- For multiplayer
```

## Project-Specific Conventions

### File Organization Pattern
- `/app/page.tsx` - Homepage (launcher interface)
- `/app/[game]/page.tsx` - Individual game pages (e.g., `/crosswords/page.tsx`)
- `/app/api/[resource]/route.ts` - API routes for Supabase queries
- `/app/leaderboards/page.tsx` - Unified leaderboards page with filters

### Design System Requirements
- **Mobile-first:** All components must be responsive
- **Dark/Light Mode:** Use Tailwind's `dark:` variant throughout
- **Minimalist UI:** Clean, modern design matching existing mockups
- **Fonts:** Geist Sans (UI) + Geist Mono (code/numbers) already configured

### Game Implementation Pattern
Each game follows this structure:
1. **Core Logic Component:** React component with game state (e.g., `<CrosswordGrid />`)
2. **Timer Integration:** Track time from start to completion in milliseconds
3. **API Route:** Fetch puzzle data (`/api/puzzle/[id]`) and submit scores (`/api/scores`)
4. **Dictionary Validation:** For PT-PT mode, validate words against `dictionary_pt` table

### Multiplayer Architecture (Phase 4)
- **Real-time Sync:** Use Supabase Realtime subscriptions on `game_rooms` table
- **Game State Management:** Store JSON game state in `game_rooms.game_state`
- **Flow:** Player action → Update `game_rooms` → Broadcast via Realtime → UI updates for all players

## Development Workflows

### Local Development
```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (test before deploy)
npm run lint         # ESLint with Next.js config
```

### Supabase Integration (Once Setup)
```typescript
// Pattern for client creation (use environment variables)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### PWA Configuration (Phase 5)
Install `next-pwa` and configure:
- `manifest.json` with Nexo branding
- Service worker for offline homepage access
- Icons for iOS/Android (180x180, 512x512)

## Key Integration Points

### Daily Challenge System
- **Cron Job:** Supabase function runs at midnight to update `daily_puzzle` table
- **Leaderboard Filter:** Query `scores` WHERE `puzzle_id` = today's daily puzzle
- **Timer Competition:** Display Top 10 fastest times in `mm:ss:ms` format

### Portuguese Dictionary Integration
- **Source:** LibreOffice PT-PT word list (open-source)
- **Loading:** Bulk insert into `dictionary_pt` during Phase 1
- **Validation Endpoint:** `/api/check-word` queries this table

### Authentication Flow
- **Anonymous Play:** Allow singleplayer without login
- **Required for:** Leaderboard submissions, multiplayer games
- **Provider:** Supabase Auth (Email/Password + Google OAuth)

## Common Pitfalls to Avoid
- Don't hardcode puzzle data - always fetch from Supabase
- Don't use European Portuguese (PT-PT) and Brazilian Portuguese (PT-BR) interchangeably
- Don't implement multiplayer without real-time subscriptions (REST polling insufficient)
- Don't forget millisecond precision for leaderboard times (use `time_ms` not seconds)
- Don't skip PWA manifest - it's core to the product identity

## Testing & Deployment
- **Preview Deployments:** Every Git push triggers Vercel preview
- **Production:** Push to `main` branch auto-deploys to production
- **Environment Variables:** Configure Supabase keys in Vercel dashboard
- **Mobile Testing:** Use Chrome DevTools device emulation + real iOS/Android devices

## Documentation References
- Full project spec: `/README.md`
- Task breakdown: `/copilot-instructions.md` (track progress with checkboxes)
- Supabase docs: https://supabase.com/docs
- Next.js App Router: https://nextjs.org/docs/app
