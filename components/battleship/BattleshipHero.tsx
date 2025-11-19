interface BattleshipHeroProps {
  statusMessage: string
  roomCode?: string | null
  phase?: string
}

export function BattleshipHero({ statusMessage, roomCode, phase }: BattleshipHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900/80">
      <div className="absolute inset-0 opacity-50 blur-3xl">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-sky-200 via-blue-200 to-indigo-200 dark:from-sky-500/30 dark:via-blue-500/20 dark:to-indigo-500/30" />
      </div>
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-100/70 px-4 py-1 text-sm font-semibold text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">
            🚢 Batalha Naval 1v1 • Matchmaking + Código Privado
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Domina o Atlântico digital com animações e matchmaking Supabase
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Coloca a frota, partilha um código privado ou entra na fila global. O emparelhamento agora vive no RPC `matchmaking_join_and_create_room` com presença Realtime, abrindo salas seguras em segundos.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-slate-200/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Tabuleiro 10x10 • Frota clássica
            </span>
            <span className="rounded-full border border-slate-200/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Estados em tempo real via Realtime
            </span>
            <span className="rounded-full border border-slate-200/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Private code + modo público
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 text-sm text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Estado</p>
          <p className="mt-2 text-2xl font-semibold">{statusMessage}</p>
          {roomCode && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Código da sala: <span className="font-mono text-lg text-sky-500 dark:text-sky-300">{roomCode}</span>
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Fase atual: <span className="font-semibold capitalize text-slate-800 dark:text-white">{phase ?? 'placement'}</span>
          </p>
        </div>
      </div>
    </header>
  )
}
