interface ModeSelectionProps {
  onSelectMode: (mode: 'local' | 'online') => void
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-6xl">
          Batalha Naval
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Comanda a tua frota e destrói os navios inimigos.
        </p>
      </div>

      <div className="grid gap-6 w-full max-w-2xl sm:grid-cols-2">
        <button
          onClick={() => onSelectMode('local')}
          className="group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-sky-500 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
        >
          <div className="rounded-2xl bg-sky-100 p-4 text-4xl dark:bg-sky-900/30">
            👥
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Modo Local</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Joga contra um amigo no mesmo dispositivo.
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('online')}
          className="group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-8 text-center transition-all hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500"
        >
          <div className="rounded-2xl bg-indigo-100 p-4 text-4xl dark:bg-indigo-900/30">
            ⚔️
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Online</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Desafia amigos ou encontra adversários aleatórios.
            </p>
          </div>
          <span className="absolute top-4 right-4 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      </div>
    </div>
  )
}
