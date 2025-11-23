import { BattleshipBoard } from '@/lib/games/battleship'
import { TargetCell } from '@/hooks/useBattleshipBoards'
import { motion } from 'framer-motion'

interface BattleBoardProps {
  myBoard: BattleshipBoard
  targetBoard: TargetCell[][]
  incomingAttacks: TargetCell[][]
  onTargetClick: (row: number, col: number) => void
  isMyTurn: boolean
  statusMessage: string
  opponentName?: string
  playSound: (type: 'hover' | 'click' | 'shoot' | 'hit' | 'miss') => void
}

export function BattleBoard({
  myBoard,
  targetBoard,
  incomingAttacks,
  onTargetClick,
  isMyTurn,
  statusMessage,
  opponentName = 'Adversário',
  playSound
}: BattleBoardProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      {/* Status Bar */}
      <div className="sticky top-4 z-20 mx-auto w-full max-w-xl rounded-full border border-white/10 bg-black/60 px-8 py-4 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className={`text-xl font-black tracking-wider uppercase ${isMyTurn ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`}>
          {statusMessage}
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr,auto,1fr] items-start">
        {/* Target Grid (Main Interaction) */}
        <div className="flex flex-col items-center gap-6 order-1 lg:order-2">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3 tracking-widest">
            <span className="text-3xl">🎯</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">ÁGUAS INIMIGAS</span>
          </h3>

          <div className="relative rounded-2xl bg-red-900/10 p-6 shadow-[0_0_50px_rgba(220,38,38,0.2)] border border-red-500/30 backdrop-blur-sm">
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[size:10%_10%] rounded-2xl" />

            <div className="grid grid-cols-10 gap-1 relative z-10">
              {targetBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  let cellContent = null
                  let cellClass = "h-8 w-8 sm:h-12 sm:w-12 rounded-sm transition-all duration-300 flex items-center justify-center text-xl font-bold cursor-pointer border border-white/5 "

                  if (cell === 'hit') {
                    cellClass += "bg-red-500/80 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-95 z-10 "
                    cellContent = <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white">💥</motion.span>
                  } else if (cell === 'miss') {
                    cellClass += "bg-white/10 text-slate-400 border-white/10 "
                    cellContent = <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>🌊</motion.span>
                  } else {
                    cellClass += "hover:bg-red-500/20 hover:border-red-400/50 "
                  }

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={cellClass}
                      onClick={() => onTargetClick(rowIndex, colIndex)}
                      onMouseEnter={() => isMyTurn && cell === '' && playSound('hover')}
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
        <div className="flex flex-col items-center gap-4 order-2 lg:order-1 opacity-90 hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
            A TUA FROTA
          </h3>

          <div className="rounded-xl bg-cyan-900/10 p-3 border border-cyan-500/20 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="grid grid-cols-10 gap-px bg-cyan-500/20 border border-cyan-500/20">
              {myBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isShip = cell !== '~'
                  const attackStatus = incomingAttacks?.[rowIndex]?.[colIndex]

                  let cellClass = `h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center text-[10px] transition-colors duration-300 `

                  if (attackStatus === 'hit') {
                    cellClass += 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)] z-10'
                  } else if (attackStatus === 'miss') {
                    cellClass += 'bg-white/20'
                  } else if (isShip) {
                    cellClass += 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]'
                  } else {
                    cellClass += 'bg-black/40'
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

        {/* Opponent Info */}
        <div className="flex flex-col items-center gap-4 order-3">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] ring-2 ring-white/20"></div>
              <div>
                <div className="font-bold text-white text-lg">{opponentName}</div>
                <div className="text-xs text-red-400 font-bold uppercase tracking-wider animate-pulse">Em combate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

