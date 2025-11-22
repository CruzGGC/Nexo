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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Sopa de Letras</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Escolha o Modo de Jogo</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Selecione como quer jogar sopa de letras</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-3">
            <button
              onClick={() => onSelectMode('daily')}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-yellow-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-yellow-600"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-100 text-4xl transition-transform group-hover:scale-110 dark:bg-yellow-900">
                📅
              </div>
              <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Modo Diário</h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                O mesmo puzzle para todos os jogadores. Novo puzzle todos os dias à meia-noite.
              </p>
              <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                <li>✓ Competição global</li>
                <li>✓ Leaderboard partilhada</li>
                <li>✓ 1 puzzle por dia</li>
              </ul>
              <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-yellow-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-yellow-800" />
            </button>

            <button
              onClick={() => onSelectMode('random')}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-blue-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-4xl transition-transform group-hover:scale-110 dark:bg-blue-900">
                🎲
              </div>
              <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Modo Aleatório</h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Puzzle novo gerado automaticamente a cada jogo. Treino ilimitado!</p>
              <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                <li>✓ Puzzles infinitos</li>
                <li>✓ Prática sem pressão</li>
                <li>✓ Sem limite de tempo</li>
              </ul>
              <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-blue-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-blue-800" />
            </button>

            <button
              onClick={() => onSelectMode('duel')}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-purple-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-purple-600"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100 text-4xl transition-transform group-hover:scale-110 dark:bg-purple-900">
                ⚔️
              </div>
              <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">1v1 Duelo</h3>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Desafia um amigo ou encontra um oponente online para ver quem completa mais rápido.
              </p>
              <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                <li>✓ Matchmaking em tempo real</li>
                <li>✓ Sistema de ELO</li>
                <li>✓ Mesmo puzzle para ambos</li>
              </ul>
              <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-purple-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-purple-800" />
            </button>
          </div>

          {isLoading && gameMode && (
            <div className="mt-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
              <p className="text-zinc-600 dark:text-zinc-400">{loadingCopy[gameMode]}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
