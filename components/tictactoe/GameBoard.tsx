type CellValue = 'X' | 'O' | null

interface GameBoardProps {
  board: CellValue[]
  onCellClick: (index: number) => void
  currentPlayer: CellValue
  isMyTurn: boolean
  winner: CellValue | null
  winningLine: number[] | null
  onReset: () => void
  statusMessage: string
  opponentName?: string
  isDraw?: boolean
}

export function GameBoard({
  board,
  onCellClick,
  currentPlayer,
  isMyTurn,
  winner,
  winningLine,
  onReset,
  statusMessage,
  opponentName,
  isDraw
}: GameBoardProps) {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700 w-full max-w-lg mx-auto">
      {/* Status Bar */}
      <div className="sticky top-4 z-10 mx-auto w-full rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-center shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className={`text-lg font-bold ${
          winner 
            ? 'text-green-600 dark:text-green-400' 
            : isDraw 
              ? 'text-slate-600 dark:text-slate-400'
              : isMyTurn 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-amber-600 dark:text-amber-400'
        }`}>
          {statusMessage}
        </div>
      </div>

      {/* Game Grid */}
      <div className="relative p-4 rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index)
            const canClick = !cell && !winner && !isDraw && isMyTurn

            return (
              <button
                key={index}
                onClick={() => canClick && onCellClick(index)}
                disabled={!canClick}
                className={`
                  relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-xl text-5xl sm:text-6xl font-black transition-all duration-300
                  ${cell 
                    ? 'cursor-default' 
                    : canClick 
                      ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' 
                      : 'cursor-not-allowed opacity-50'
                  }
                  ${isWinningCell 
                    ? 'bg-green-100 text-green-600 scale-105 shadow-lg dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                  }
                `}
              >
                <span className={`transform transition-all duration-300 ${cell ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                  {cell === 'X' && <span className="text-indigo-500 dark:text-indigo-400">✕</span>}
                  {cell === 'O' && <span className="text-rose-500 dark:text-rose-400">○</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Player Info / Reset */}
      <div className="flex w-full justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${currentPlayer === 'X' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Tu (X)
          </span>
        </div>

        {(winner || isDraw) && (
          <button
            onClick={onReset}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 hover:scale-105 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Jogar Novamente
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
            {opponentName || 'Oponente'} (O)
          </span>
          <div className={`h-3 w-3 rounded-full ${currentPlayer === 'O' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
        </div>
      </div>
    </div>
  )
}
