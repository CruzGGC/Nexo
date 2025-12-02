'use client'

/**
 * DuelProgressBar - Progress bar for duel matches
 * 
 * Shows comparative progress between two players
 */

import { motion } from 'framer-motion'

interface DuelProgressBarProps {
  /** Your progress (0-100) */
  myProgress: number
  /** Opponent's progress (0-100) */
  opponentProgress: number
  /** Your display name */
  myName?: string
  /** Opponent's display name */
  opponentName?: string
  /** Whether you are player 1 (left side) */
  isPlayer1?: boolean
  /** Show labels */
  showLabels?: boolean
}

export function DuelProgressBar({
  myProgress,
  opponentProgress,
  myName = 'Tu',
  opponentName = 'Oponente',
  isPlayer1 = true,
  showLabels = true
}: DuelProgressBarProps) {
  const player1Progress = isPlayer1 ? myProgress : opponentProgress
  const player2Progress = isPlayer1 ? opponentProgress : myProgress
  const player1Name = isPlayer1 ? myName : opponentName
  const player2Name = isPlayer1 ? opponentName : myName

  return (
    <div className="w-full space-y-2">
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs font-medium">
          <span className="text-[#00f3ff]">{player1Name}</span>
          <span className="text-zinc-400">vs</span>
          <span className="text-[#bc13fe]">{player2Name}</span>
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
        {/* Player 1 progress (left, cyan) */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00f3ff] to-[#00f3ff]/70 rounded-l-full"
          initial={{ width: 0 }}
          animate={{ width: `${player1Progress / 2}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {/* Center divider */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-white/20 transform -translate-x-1/2" />

        {/* Player 2 progress (right, purple) */}
        <motion.div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-[#bc13fe] to-[#bc13fe]/70 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${player2Progress / 2}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Percentage labels */}
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{Math.round(player1Progress)}%</span>
        <span>{Math.round(player2Progress)}%</span>
      </div>
    </div>
  )
}

export default DuelProgressBar
