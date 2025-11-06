# 🚀 Nexo - Setup Guide

## Quick Start

You've just set up the foundation for Nexo! Here's what's been configured:

### ✅ What's Done
- ✅ Next.js 16 with App Router
- ✅ Tailwind CSS v4 configured
- ✅ TypeScript with strict mode
- ✅ Supabase JS client installed
- ✅ Database schema designed (`supabase/migrations/001_initial_schema.sql`)
- ✅ TypeScript types for database (`lib/database.types.ts`)
- ✅ Minimalist homepage with Portuguese language support
- ✅ Basic page structure (Crosswords, Leaderboards, About)

### 🔧 Next Steps

#### 1. Create Your Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project (choose a region close to Portugal)
3. Wait for the project to be provisioned (~2 minutes)

#### 2. Set Up Database
1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL to create all tables
4. Verify tables were created in the Table Editor

#### 3. Configure Environment Variables
1. Go to **Settings → API** in your Supabase dashboard
2. Copy your Project URL and anon/public key
3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

#### 4. Run the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

### 📁 Project Structure

```
nexo/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (PT-PT, fonts, metadata)
│   ├── page.tsx                 # Homepage (launcher)
│   ├── palavras-cruzadas/       # Crosswords game
│   ├── leaderboards/            # Leaderboards page
│   └── sobre/                   # About page
├── lib/
│   ├── supabase.ts              # Supabase client instance
│   └── database.types.ts        # TypeScript types for DB
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
└── .env.local                   # Your environment variables (not in git)
```

### 🎯 Development Roadmap

#### Phase 2: Crosswords Game (Current Priority)
- [ ] Create `<CrosswordGrid />` component
- [ ] Implement game logic (navigation, input, validation)
- [ ] Add timer functionality
- [ ] Create API route `/api/puzzle/[id]`
- [ ] Implement score submission

#### Phase 3: Leaderboards
- [ ] Daily puzzle leaderboard
- [ ] General leaderboards
- [ ] User profiles

#### Phase 4: Multiplayer
- [ ] Card games (Solitário, Sueca)
- [ ] Real-time game rooms
- [ ] Supabase Realtime integration

#### Phase 5: PWA
- [ ] Install `next-pwa`
- [ ] Create `manifest.json`
- [ ] Add app icons
- [ ] Configure service worker

### 📚 Key Files to Edit Next

1. **`app/palavras-cruzadas/page.tsx`** - Build the crosswords game UI
2. **`app/api/puzzle/[id]/route.ts`** - Create API route to fetch puzzles
3. **`app/api/scores/route.ts`** - Create API route to submit scores
4. **`components/CrosswordGrid.tsx`** - Build the crossword grid component

### 🔐 Authentication Setup (When Ready)

Supabase Auth is already configured in the schema. To add authentication:

1. Enable auth providers in Supabase dashboard (Email, Google, etc.)
2. Create auth components (login, signup)
3. Use the auth helper:
   ```typescript
   import { supabase } from '@/lib/supabase'
   
   // Sign up
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123'
   })
   
   // Sign in
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password123'
   })
   
   // Get current user
   const { data: { user } } = await supabase.auth.getUser()
   ```

### 🇵🇹 Portuguese Dictionary

For the PT-PT dictionary (`dictionary_pt` table):

1. Download LibreOffice Portuguese dictionary:
   ```bash
   wget https://github.com/LibreOffice/dictionaries/raw/master/pt_PT/pt_PT.dic
   ```

2. Process and insert words into Supabase (you'll need to create a script for this)

### 🐛 Troubleshooting

**"Missing Supabase environment variables"**
- Make sure `.env.local` exists and has both variables set
- Restart the dev server after adding environment variables

**TypeScript errors in `lib/supabase.ts`**
- Ensure `lib/database.types.ts` exists
- Run `npm run dev` to regenerate types

**Styles not applying**
- Check that Tailwind CSS is configured correctly
- Verify `postcss.config.mjs` has `@tailwindcss/postcss` plugin

### 📖 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 🚢 Deployment

When ready to deploy:

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy! 🎉

---

**Ready to build!** Start with the crosswords game logic next. 🎮
