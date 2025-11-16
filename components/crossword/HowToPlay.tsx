import type { CrosswordPuzzle, GameMode } from '@/lib/types/games'

interface HowToPlayProps {
  gameMode: GameMode
  puzzle: CrosswordPuzzle
  onStart: () => void
}

export function HowToPlay({ gameMode, puzzle, onStart }: HowToPlayProps) {
  return (
    <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Como Jogar</h2>
      <ul className="mb-6 space-y-2 text-zinc-700 dark:text-zinc-300">
        <li>• Clique numa célula para começar a escrever</li>
        <li>• Use as <strong>setas</strong> do teclado para navegar</li>
        <li>• Prima <strong>Tab</strong> para alternar entre horizontal/vertical</li>
        <li>• Prima <strong>Backspace</strong> para apagar</li>
        <li>• Clique nas pistas para saltar para essa palavra</li>
        <li>• O temporizador começa quando clicar em &quot;Iniciar Jogo&quot;</li>
      </ul>
      {gameMode === 'daily' && puzzle.isFromPreviousDay && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Este é o puzzle de um dia anterior. O puzzle de hoje será gerado à meia-noite.
          </p>
        </div>
      )}
      <button
        onClick={onStart}
        className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Iniciar Jogo
      </button>
    </div>
  )
}
