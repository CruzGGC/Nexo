import type { CrosswordPuzzle, GameMode } from '@/lib/types/games'

interface HowToPlayProps {
  gameMode: GameMode
  puzzle: CrosswordPuzzle
  onStart: () => void
}

export function HowToPlay({ gameMode, puzzle, onStart }: HowToPlayProps) {
  return (
    <div className="mb-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📝</span>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Como Jogar</h2>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              🖱️
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 pt-1">
              Clique numa célula para começar a escrever
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              ⌨️
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 pt-1">
              Use as <strong>setas</strong> para navegar e <strong>Tab</strong> para mudar direção
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              ⌫
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 pt-1">
              Prima <strong>Backspace</strong> para apagar letras
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              💡
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 pt-1">
              Clique nas pistas para saltar para a palavra correspondente
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              ⏱️
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 pt-1">
              O tempo começa a contar assim que clicar em &quot;Iniciar Jogo&quot;
            </p>
          </div>
        </div>
      </div>

      {gameMode === 'daily' && puzzle.isFromPreviousDay && (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Este é o puzzle de um dia anterior. O puzzle de hoje será gerado à meia-noite.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onStart}
        className="w-full rounded-xl bg-zinc-900 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg"
      >
        Iniciar Jogo
      </button>
    </div>
  )
}
