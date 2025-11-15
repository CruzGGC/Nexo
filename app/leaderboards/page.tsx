import LeaderboardsClient from '@/components/LeaderboardsClient'
import AuthCallout from '@/components/AuthCallout'

export default function LeaderboardsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef9c3,_transparent_40%),#f5f5f4] px-6 py-16 dark:bg-[radial-gradient(circle_at_top,_rgba(253,230,138,0.1),_transparent_45%),#020617]">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
            Ranking oficial Nexo
          </p>
          <h1 className="text-4xl font-black text-zinc-900 drop-shadow-sm dark:text-zinc-50">
            Leaderboards & Elo
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            Toda a gente pode jogar como convidado. Faz login (ou liga a tua conta anónima) para desbloquear XP, Elo, matchmaking
            inteligente e o teu lugar permanente no topo das tabelas.
          </p>
        </header>

        <div className="rounded-3xl border border-amber-100 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-amber-500/20 dark:bg-zinc-900/60">
          <LeaderboardsClient />
        </div>

        <AuthCallout />

        <section className="grid gap-6 rounded-3xl border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 sm:grid-cols-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Modo convidado</h3>
            <p>Utiliza o novo fluxo de login anónimo da Supabase para entrar em salas privadas ou diárias sem conta.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Upgrade instantâneo</h3>
            <p>Quando decidires ligar a tua conta Google/Email usamos <code className="rounded bg-zinc-900/5 px-1 dark:bg-white/10">auth.linkIdentity()</code> para manter XP e histórico.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Matchmaking justo</h3>
            <p>O Elo/Glicko vive em <code className="rounded bg-zinc-900/5 px-1 dark:bg-white/10">player_ratings</code> e alimenta a fila inteligente em tempo real.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
