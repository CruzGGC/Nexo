'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRankTier, getRankProgress, formatRatingChange, type RankTier } from '@/lib/rating-system'

export interface MatchStats {
  timeMs?: number
  wordsFound?: number
  totalWords?: number
  movesCount?: number
  accuracy?: number
}

export interface RatingInfo {
  oldRating: number
  newRating: number
  ratingChange: number
  oldTier: RankTier
  newTier: RankTier
  rankProgress: number
  matchesPlayed: number
  winRate: number
}

interface GameResultModalProps {
  isOpen: boolean
  result: 'victory' | 'defeat' | 'draw'
  winnerName?: string
  onClose: () => void
  // New optional props for enhanced display
  ratingInfo?: RatingInfo
  matchStats?: MatchStats
  gameType?: string
}

// Format time in mm:ss:ms
function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
}

export function GameResultModal({ 
  isOpen, 
  result, 
  winnerName, 
  onClose,
  ratingInfo,
  matchStats,
  gameType
}: GameResultModalProps) {
  const [mounted, setMounted] = useState(false)
  const [showRatingAnimation, setShowRatingAnimation] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => {
      clearTimeout(timer)
      setMounted(false)
    }
  }, [])

  // Trigger rating animation after modal appears
  useEffect(() => {
    if (isOpen && ratingInfo) {
      const timer = setTimeout(() => setShowRatingAnimation(true), 500)
      return () => clearTimeout(timer)
    }
    setShowRatingAnimation(false)
  }, [isOpen, ratingInfo])

  if (!mounted || !isOpen) return null

  const tierChanged = ratingInfo && ratingInfo.oldTier.name !== ratingInfo.newTier.name
  const isPromotion = tierChanged && ratingInfo && ratingInfo.newRating > ratingInfo.oldRating

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 ${
          result === 'victory' 
            ? 'bg-gradient-to-b from-yellow-500/10 to-orange-500/5' 
            : result === 'defeat'
              ? 'bg-gradient-to-b from-red-500/10 to-purple-500/5'
              : 'bg-gradient-to-b from-blue-500/5 to-purple-500/5'
        }`} />

        <div className="relative z-10">
          {/* Result Icon */}
          <motion.div 
            className="mb-4 text-6xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
          >
            {result === 'victory' ? '🏆' : result === 'defeat' ? '💔' : '🤝'}
          </motion.div>

          {/* Result Title */}
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`mb-2 text-3xl font-black tracking-tight uppercase italic ${
              result === 'victory'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500'
                : result === 'defeat'
                  ? 'text-red-500'
                  : 'text-white'
            }`}
          >
            {result === 'victory' ? 'Vitória!' : result === 'defeat' ? 'Derrota!' : 'Empate!'}
          </motion.h2>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 text-sm text-zinc-400"
          >
            {result === 'victory'
              ? 'Parabéns! Foste o mais rápido.'
              : result === 'defeat'
                ? `${winnerName ? `${winnerName} terminou primeiro.` : 'O teu oponente terminou primeiro.'}`
                : 'Foi um jogo muito renhido!'}
          </motion.p>

          {/* Rating Section */}
          {ratingInfo && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-4"
            >
              {/* Tier Badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">{ratingInfo.newTier.icon}</span>
                <span 
                  className="text-lg font-bold"
                  style={{ color: ratingInfo.newTier.color }}
                >
                  {ratingInfo.newTier.name}
                </span>
                {tierChanged && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isPromotion 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {isPromotion ? '⬆ Promoção!' : '⬇ Despromoção'}
                  </motion.span>
                )}
              </div>

              {/* Rating Display */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-white">
                    {showRatingAnimation ? ratingInfo.newRating : ratingInfo.oldRating}
                  </div>
                  <div className="text-xs text-zinc-500">Rating</div>
                </div>
                
                <AnimatePresence>
                  {showRatingAnimation && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`text-xl font-bold ${
                        ratingInfo.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatRatingChange(ratingInfo.ratingChange)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rank Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: ratingInfo.newTier.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${ratingInfo.rankProgress}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
                  <span>{ratingInfo.newTier.name}</span>
                  <span>{ratingInfo.rankProgress.toFixed(0)}%</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-white/5">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{ratingInfo.matchesPlayed}</div>
                  <div className="text-[10px] text-zinc-500">Jogos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {(ratingInfo.winRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-zinc-500">Vitórias</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Match Stats Section */}
          {matchStats && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 flex justify-center gap-4"
            >
              {matchStats.timeMs !== undefined && (
                <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                  <div className="text-lg font-mono font-bold text-cyan-400">
                    {formatTime(matchStats.timeMs)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Tempo</div>
                </div>
              )}
              {matchStats.wordsFound !== undefined && matchStats.totalWords !== undefined && (
                <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-purple-400">
                    {matchStats.wordsFound}/{matchStats.totalWords}
                  </div>
                  <div className="text-[10px] text-zinc-500">Palavras</div>
                </div>
              )}
              {matchStats.accuracy !== undefined && (
                <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-green-400">
                    {matchStats.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-zinc-500">Precisão</div>
                </div>
              )}
            </motion.div>
          )}

          {/* Close Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            className="w-full rounded-xl bg-white px-6 py-4 text-lg font-bold text-black transition-all hover:scale-[1.02] hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Voltar ao Menu
          </motion.button>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
