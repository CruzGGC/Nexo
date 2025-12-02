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
  score: { x: number; o: number; draws: number }
  gameMode: 'local' | 'online'
  resetLabel?: string
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
  isDraw,
  score,
  gameMode,
  resetLabel
}: GameBoardProps) {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700 w-full max-w-lg mx-auto">
      {/* Status Bar */}
      <div className="sticky top-4 z-20 mx-auto w-full rounded-full border border-white/10 bg-black/60 px-6 py-3 text-center shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className={`text-lg font-bold tracking-wide ${winner
            ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]'
            : isDraw
              ? 'text-slate-400'
              : isMyTurn
                ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]'
                : 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]'
          }`}>
          {statusMessage}
        </div>
      </div>

      {/* Scoreboard */}
      {gameMode === 'local' && (
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="flex flex-col items-center rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 backdrop-blur-md">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Jogador X</span>
            <span className="text-2xl font-black text-white">{score.x}</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empates</span>
            <span className="text-2xl font-black text-white">{score.draws}</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 backdrop-blur-md">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Jogador O</span>
            <span className="text-2xl font-black text-white">{score.o}</span>
          </div>
        </div>
      )}

      {/* Game Grid */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-b from-white/5 to-white/0 shadow-2xl border border-white/10 backdrop-blur-md">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index)
            const canClick = !cell && !winner && !isDraw && isMyTurn

            return (
              <button
                key={index}
                onClick={() => canClick && onCellClick(index)}
                disabled={!canClick}
                className={`
                  relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-2xl text-6xl sm:text-7xl font-black transition-all duration-300
                  ${cell
                    ? 'cursor-default bg-white/5 border border-white/10'
                    : canClick
                      ? 'cursor-pointer bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                      : 'cursor-not-allowed opacity-50 bg-black/20 border border-white/5'
                  }
                  ${isWinningCell && 'bg-green-500/20 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-105 z-10'}
                `}
              >
                <span className={`transform transition-all duration-300 ${cell ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                  {cell === 'X' && (
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      X
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                      O
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Player Info / Reset */}
      <div className="flex w-full justify-between items-center px-4">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] ${currentPlayer === 'X' ? 'bg-blue-500 text-blue-500 animate-pulse' : 'bg-slate-700 text-slate-700'}`} />
          <span className={`text-sm font-bold ${currentPlayer === 'X' ? 'text-blue-400' : 'text-slate-500'}`}>
            TU (X)
          </span>
        </div>

        {(winner || isDraw) && (
          <button
            onClick={onReset}
            className="rounded-full bg-white px-8 py-3 text-sm font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition hover:bg-slate-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            {resetLabel || 'JOGAR NOVAMENTE'}
          </button>
        )}

        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${currentPlayer === 'O' ? 'text-purple-400' : 'text-slate-500'}`}>
            {opponentName || 'OPONENTE'} (O)
          </span>
          <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] ${currentPlayer === 'O' ? 'bg-purple-500 text-purple-500 animate-pulse' : 'bg-slate-700 text-slate-700'}`} />
        </div>
      </div>
    </div>
  )
}
