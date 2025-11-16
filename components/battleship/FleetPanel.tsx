import type { BattleshipBoard } from '@/lib/games/battleship'

interface FleetPanelProps {
  board: BattleshipBoard
  showShips: boolean
}

export function FleetPanel({ board, showShips }: FleetPanelProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Oceano Aliado
      </p>
      <div className="grid grid-cols-10 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isShip = cell !== '~'
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                  isShip && showShips
                    ? 'bg-sky-500/80 text-white shadow-inner'
                    : 'bg-white text-slate-400 dark:bg-slate-800'
                } dark:text-white`}
              >
                {isShip && showShips ? cell : ''}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
