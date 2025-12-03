'use client'

import { motion } from 'framer-motion'
import { formatChronometer } from '@/lib/utils/time'
import Image from 'next/image'

interface Player {
  id: string
  displayName: string
  avatarUrl?: string
  progress: number
  isReady?: boolean
}

interface DuelGameLayoutProps {
  myPlayer: Player
  opponent?: Player
  timeMs: number
  gameTitle: string
  children: React.ReactNode
  isComplete?: boolean
  winner?: 'me' | 'opponent' | 'draw' | null
  onLeave?: () => void
}

export function DuelGameLayout({
  myPlayer,
  opponent,
  timeMs,
  gameTitle,
  children,
  isComplete,
  winner,
  onLeave
}: DuelGameLayoutProps) {
  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00f3ff]/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#bc13fe]/20 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Leave Button */}
            {onLeave && (
              <button
                onClick={onLeave}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Sair
              </button>
            )}

            {/* Game Title & Mode */}
            <div className="flex items-center gap-3">
              <span className="text-xl">⚔️</span>
              <span className="font-bold text-white uppercase tracking-wider">{gameTitle}</span>
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#00f3ff]/20 to-[#bc13fe]/20 border border-[#00f3ff]/30 rounded-full text-[#00f3ff]">
                Duelo
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Tempo</span>
              <span className="font-mono text-xl font-bold text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">
                {formatChronometer(timeMs)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6">
        {/* Player Status Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* My Player Card */}
          <PlayerCard
            player={myPlayer}
            isMe={true}
            isWinner={winner === 'me'}
            isComplete={isComplete}
          />

          {/* VS Indicator */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] blur-xl opacity-30" />
              <div className="relative px-6 py-3 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bc13fe]">
                  VS
                </span>
              </div>
            </motion.div>
          </div>

          {/* Opponent Card */}
          <PlayerCard
            player={opponent || { id: 'waiting', displayName: 'A aguardar...', progress: 0 }}
            isMe={false}
            isWinner={winner === 'opponent'}
            isComplete={isComplete}
          />
        </div>

        {/* Game Area */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 backdrop-blur-md">
          {children}
        </div>
      </main>
    </div>
  )
}

interface PlayerCardProps {
  player: Player
  isMe: boolean
  isWinner?: boolean
  isComplete?: boolean
}

function PlayerCard({ player, isMe, isWinner, isComplete }: PlayerCardProps) {
  const progressColor = isMe ? '#00f3ff' : '#bc13fe'
  const glowColor = isMe ? 'rgba(0,243,255,0.3)' : 'rgba(188,19,254,0.3)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-md p-4
        ${isWinner ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10 bg-white/5'}
        ${isComplete && isWinner ? 'shadow-[0_0_30px_rgba(234,179,8,0.3)]' : ''}
      `}
    >
      {/* Winner Crown */}
      {isWinner && isComplete && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-2 right-2 text-2xl"
        >
          👑
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className={`
            relative w-12 h-12 rounded-full border-2 flex items-center justify-center
            ${isMe ? 'border-[#00f3ff] bg-[#00f3ff]/10' : 'border-[#bc13fe] bg-[#bc13fe]/10'}
          `}
          style={{ boxShadow: `0 0 15px ${glowColor}` }}
        >
          {player.avatarUrl ? (
            <Image
              src={player.avatarUrl}
              alt={player.displayName}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-xl">{isMe ? '🎮' : '🎯'}</span>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate">
              {player.displayName}
            </span>
            {isMe && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                Tu
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-500">Progresso</span>
              <span className="font-mono font-bold" style={{ color: progressColor }}>
                {Math.round(player.progress)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: progressColor }}
                initial={{ width: 0 }}
                animate={{ width: `${player.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ready Status (during waiting) */}
      {player.isReady !== undefined && (
        <div className={`mt-3 text-center text-xs font-bold uppercase tracking-wider ${player.isReady ? 'text-emerald-400' : 'text-zinc-500'}`}>
          {player.isReady ? '✓ Pronto' : 'A aguardar...'}
        </div>
      )}
    </motion.div>
  )
}

export default DuelGameLayout
