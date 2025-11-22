import { BattleshipBoard } from '@/lib/games/battleship'
import { TargetCell } from '@/hooks/useBattleshipBoards'

interface BattleBoardProps {
  myBoard: BattleshipBoard
  targetBoard: TargetCell[][]
  incomingAttacks: TargetCell[][]
  onTargetClick: (row: number, col: number) => void
  isMyTurn: boolean
  statusMessage: string
  opponentName?: string
}

export function BattleBoard({
  myBoard,
  targetBoard,
  incomingAttacks,
  onTargetClick,
  isMyTurn,
  statusMessage,
  opponentName = 'Adversário'
}: BattleBoardProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      {/* Status Bar */}
      <div className="sticky top-4 z-10 mx-auto w-full max-w-xl rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-center shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className={`text-lg font-bold ${isMyTurn ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {statusMessage}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,auto,1fr] items-start">
        {/* Target Grid (Main Interaction) */}
        <div className="flex flex-col items-center gap-4 order-1 lg:order-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎯</span>
            <span>Águas Inimigas</span>
          </h3>
          
          <div className="relative rounded-xl bg-blue-500/10 p-4 shadow-2xl ring-4 ring-slate-100 dark:ring-slate-800">
            <div className="grid grid-cols-10 gap-1">
              {targetBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  let cellContent = ''
                  let cellClass = "h-8 w-8 sm:h-12 sm:w-12 rounded transition-all duration-300 flex items-center justify-center text-lg font-bold cursor-pointer hover:scale-105 "
                  
                  if (cell === 'hit') {
                    cellClass += "bg-red-500 text-white shadow-lg scale-95"
                    cellContent = '💥'
                  } else if (cell === 'miss') {
                    cellClass += "bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-500"
                    cellContent = '🌊'
                  } else {
                    cellClass += "bg-white hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  }

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={cellClass}
                      onClick={() => onTargetClick(rowIndex, colIndex)}
                      disabled={!isMyTurn || cell !== ''}
                    >
                      {cellContent}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* My Fleet (Status) */}
        <div className="flex flex-col items-center gap-4 order-2 lg:order-1 opacity-80 hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            A tua Frota
          </h3>
          
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-10 gap-px bg-slate-300 dark:bg-slate-700 border border-slate-300 dark:border-slate-700">
              {myBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isShip = cell !== '~'
                  const attackStatus = incomingAttacks?.[rowIndex]?.[colIndex]

                  let cellClass = `h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center text-[10px] `
                  
                  if (attackStatus === 'hit') {
                    cellClass += 'bg-red-500 text-white'
                  } else if (attackStatus === 'miss') {
                    cellClass += 'bg-slate-400 text-slate-600 dark:bg-slate-600 dark:text-slate-400'
                  } else if (isShip) {
                    cellClass += 'bg-slate-700 text-white'
                  } else {
                    cellClass += 'bg-white dark:bg-slate-800'
                  }

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={cellClass}
                    >
                      {attackStatus === 'hit' ? '💥' : (attackStatus === 'miss' ? '•' : '')}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Opponent Info / Chat (Placeholder) */}
        <div className="flex flex-col items-center gap-4 order-3">
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500"></div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{opponentName}</div>
                <div className="text-xs text-slate-500">Em combate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
