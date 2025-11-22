import Link from 'next/link'
import type { GameMode } from '@/lib/types/games'

interface ModeSelectionProps {
  gameMode: GameMode | null
  isLoading: boolean
  error: string | null
  onSelectMode: (mode: GameMode) => void | Promise<void>
}

const loadingCopy: Record<GameMode, string> = {
  daily: 'A carregar sopa de letras diária...',
  random: 'A gerar sopa de letras aleatória...',
  duel: 'A preparar duelo...'
}

export function ModeSelection({ gameMode, isLoading, error, onSelectMode }: ModeSelectionProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 py-12 animate-in fade-in zoom-in duration-500 dark:from-zinc-950 dark:to-black">
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Sopa de Letras
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Encontra as palavras escondidas. Treina a tua observação.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/50">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid gap-6 w-full max-w-5xl sm:grid-cols-3 px-6">
        <button
          onClick={() => onSelectMode('daily')}
          disabled={isLoading}
          className="group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-8 text-center transition-all hover:border-yellow-400 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-yellow-600"
        >
          <div className="rounded-2xl bg-yellow-100 p-4 text-4xl dark:bg-yellow-900/30">
            📅
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Modo Diário</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              O mesmo puzzle para todos. Novo desafio à meia-noite.
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('random')}
          disabled={isLoading}
          className="group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-8 text-center transition-all hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
        >
          <div className="rounded-2xl bg-blue-100 p-4 text-4xl dark:bg-blue-900/30">
            🎲
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Modo Aleatório</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Puzzle novo a cada jogo. Treino ilimitado!
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('duel')}
          disabled={isLoading}
          className="group relative flex flex-col items-center gap-4 rounded-3xl border-2 border-zinc-200 bg-white p-8 text-center transition-all hover:border-purple-400 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-purple-600"
        >
          <div className="rounded-2xl bg-purple-100 p-4 text-4xl dark:bg-purple-900/30">
            ⚔️
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Duelo</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Desafia um amigo para ver quem resolve mais rápido.
            </p>
          </div>
        </button>
      </div>

      {isLoading && gameMode && (
        <div className="mt-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
          <p className="text-zinc-600 dark:text-zinc-400">{loadingCopy[gameMode]}</p>
        </div>
      )}
      
      <div className="mt-12">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Voltar ao Menu
        </Link>
      </div>
    </div>
  )
}
