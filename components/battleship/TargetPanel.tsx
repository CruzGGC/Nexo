import type { TargetCell } from '@/hooks/useBattleshipBoards'

interface TargetPanelProps {
  board: TargetCell[][]
  onCellClick: (row: number, col: number) => void
}

export function TargetPanel({ board, onCellClick }: TargetPanelProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Radar Ofensivo
      </p>
      <div className="grid grid-cols-10 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              type="button"
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`h-8 w-8 rounded-lg text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                cell === 'hit'
                  ? 'bg-amber-400 text-white'
                  : cell === 'miss'
                    ? 'bg-fuchsia-400 text-white'
                    : cell === 'pending'
                      ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-white text-slate-400 dark:bg-slate-800'
              }`}
            >
              {cell === 'hit' ? '•' : cell === 'miss' ? '×' : ''}
            </button>
          ))
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Marca tiros certeiros (laranja) e falhados (magenta) para acompanhar padrões enquanto o adversário responde.
      </p>
    </div>
  )
}
