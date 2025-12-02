'use client'

/**
 * CompletionModal - Crossword puzzle completion screen
 * 
 * Features:
 * - Celebration animation
 * - Final time display
 * - Score submission status (daily mode)
 * - Authentication prompts for unauthenticated users
 * - Action buttons (restart, leaderboard, change mode)
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatChronometer } from '@/lib/utils/time'

type ScoreStatus = 'idle' | 'saving' | 'success' | 'error'

// Matches lib/types/games.ts GameMode
type GameMode = 'daily' | 'random' | 'duel'

interface CompletionModalProps {
  /** Current game mode */
  gameMode: GameMode
  /** Final completion time in milliseconds */
  finalTime: number
  /** Category name (for random mode with category) */
  categoryName?: string
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Score submission status */
  scoreStatus: ScoreStatus
  /** Score submission error message */
  scoreError?: string | null
  /** Status messages for each score state */
  statusMessages: Record<ScoreStatus, string>
  /** Callback to retry score submission */
  onRetrySubmit: () => void
  /** Callback to restart the game */
  onRestart: () => void
  /** Callback to change game mode */
  onChangeMode: () => void
  /** Callback for guest sign-in */
  onSignInAsGuest: () => void
  /** Callback for Google sign-in */
  onContinueWithGoogle: () => void
}

export function CompletionModal({
  gameMode,
  finalTime,
  categoryName,
  isAuthenticated,
  scoreStatus,
  statusMessages,
  onRetrySubmit,
  onRestart,
  onChangeMode,
  onSignInAsGuest,
  onContinueWithGoogle
}: CompletionModalProps) {
  const getPuzzleTypeLabel = () => {
    if (gameMode === 'daily') return 'diário'
    if (categoryName) return `de ${categoryName}`
    return 'aleatório'
  }

  const getRestartLabel = () => {
    if (gameMode === 'daily') return 'Jogar Novamente'
    if (categoryName) return `Novo Puzzle de ${categoryName}`
    return 'Novo Puzzle Aleatório'
  }

  return (
    <motion.div
      key="completion-modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-black/40 p-8 text-center shadow-[0_0_50px_rgba(0,243,255,0.15)] backdrop-blur-xl"
    >
      <div className="mb-6 text-7xl animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🎉</div>
      <h2 className="mb-2 text-4xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
        Parabéns!
      </h2>
      <p className="mb-8 text-lg text-zinc-400">
        Completou o puzzle {getPuzzleTypeLabel()} em
      </p>

      <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 shadow-inner">
        <p className="text-xs font-bold text-[#00f3ff] uppercase tracking-widest mb-2">Tempo Final</p>
        <p className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
          {formatChronometer(finalTime)}
        </p>
      </div>

      {gameMode === 'random' && (
        <p className="mb-6 text-sm text-zinc-500">
          Modo aleatório não conta para a leaderboard global
        </p>
      )}

      {gameMode === 'daily' && (
        <div className="mb-8 text-left text-sm">
          {isAuthenticated ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <p className="font-medium">{statusMessages[scoreStatus]}</p>
              {scoreStatus === 'error' && (
                <button
                  onClick={onRetrySubmit}
                  className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                >
                  Tentar novamente
                </button>
              )}
              {scoreStatus === 'success' && (
                <p className="mt-2 text-xs text-emerald-200/60">
                  Se melhorares o tempo voltamos a atualizar automaticamente.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-300 shadow-sm">
              <p className="font-medium">
                Entra como convidado ou liga a tua conta Google para registar o tempo nas classificações diárias.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onSignInAsGuest}
                  className="flex-1 rounded-xl bg-white text-black px-4 py-3 font-bold transition hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  Entrar como Convidado
                </button>
                <button
                  onClick={onContinueWithGoogle}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-bold text-white transition hover:bg-white/10 hover:border-white/40"
                >
                  Google
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onRestart}
          className="rounded-xl bg-[#00f3ff] px-6 py-4 font-bold text-black transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]"
        >
          {getRestartLabel()}
        </button>
        {gameMode === 'daily' && (
          <Link
            href="/leaderboards"
            className="rounded-xl bg-[#bc13fe] px-6 py-4 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] text-center"
          >
            Ver Classificações
          </Link>
        )}
        <button
          onClick={onChangeMode}
          className="rounded-xl bg-transparent px-6 py-4 font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
        >
          Mudar Modo
        </button>
      </div>
    </motion.div>
  )
}

export default CompletionModal
