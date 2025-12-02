'use client'

/**
 * GameHeader - Shared header component for all games
 * 
 * Features:
 * - Back button
 * - Title with mode badge
 * - Timer display
 * - Responsive design
 */

import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatTime } from '@/lib/utils/time'

export type GameMode = 'daily' | 'random' | 'duel' | 'practice'

interface GameHeaderProps {
  /** Game title */
  title: string
  /** Current game mode */
  mode?: GameMode
  /** Time in milliseconds */
  timeMs?: number
  /** Whether timer is running */
  isTimerRunning?: boolean
  /** Back button URL (default: /) */
  backUrl?: string
  /** Custom back button handler (overrides backUrl) */
  onBack?: () => void
  /** Additional content to show in header */
  children?: React.ReactNode
}

const MODE_LABELS: Record<GameMode, { label: string; icon: string; className: string }> = {
  daily: {
    label: 'Diário',
    icon: '📅',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  random: {
    label: 'Aleatório',
    icon: '🎲',
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  duel: {
    label: 'Duelo',
    icon: '⚔️',
    className: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
  practice: {
    label: 'Treino',
    icon: '🎯',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  }
}

export function GameHeader({
  title,
  mode,
  timeMs = 0,
  isTimerRunning = false,
  backUrl = '/',
  onBack,
  children
}: GameHeaderProps) {
  const modeConfig = mode ? MODE_LABELS[mode] : null

  const BackButton = onBack ? (
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium hidden sm:inline">Voltar</span>
    </button>
  ) : (
    <Link
      href={backUrl}
      className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium hidden sm:inline">Voltar</span>
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 bg-[#030014]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Back button */}
          <div className="flex items-center gap-4 min-w-0">
            {BackButton}
            
            {/* Title and mode badge */}
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {title}
              </h1>
              
              {modeConfig && (
                <span className={`
                  hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  text-xs font-medium border
                  ${modeConfig.className}
                `}>
                  <span>{modeConfig.icon}</span>
                  <span>{modeConfig.label}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Timer and custom content */}
          <div className="flex items-center gap-4">
            {children}
            
            {/* Timer */}
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full
              bg-white/5 border border-white/10
              font-mono text-sm
              ${isTimerRunning ? 'text-white' : 'text-zinc-400'}
            `}>
              <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-[#00f3ff]' : ''}`} />
              <span className="min-w-[5ch] text-center">
                {formatTime(timeMs)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default GameHeader
