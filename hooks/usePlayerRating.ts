'use client'

import { useState, useCallback, useMemo } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { 
  calculateRating, 
  getRankTier, 
  getRankProgress, 
  createDefaultRating,
  type GlickoPlayer 
} from '@/lib/rating-system'
import type { RatingInfo } from '@/components/GameResultModal'

type GameType = 'crossword' | 'wordsearch' | 'crossword_duel' | 'wordsearch_duel' | 'tic_tac_toe' | 'battleship'

interface PlayerRating {
  rating: number
  deviation: number
  volatility: number
  matches_played: number
  win_rate: number
}

interface UsePlayerRatingReturn {
  isLoading: boolean
  error: string | null
  fetchRating: (userId: string, gameType: GameType) => Promise<PlayerRating | null>
  updateRatingAfterMatch: (
    userId: string,
    gameType: GameType,
    opponentRating: GlickoPlayer,
    result: 'win' | 'loss' | 'draw'
  ) => Promise<RatingInfo | null>
}

export function usePlayerRating(): UsePlayerRatingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])

  const fetchRating = useCallback(async (
    userId: string, 
    gameType: GameType
  ): Promise<PlayerRating | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('player_ratings')
        .select('rating, deviation, volatility, matches_played, win_rate')
        .eq('user_id', userId)
        .eq('game_type', gameType)
        .single()

      if (fetchError) {
        // No rating found - return default
        if (fetchError.code === 'PGRST116') {
          const defaultRating = createDefaultRating()
          return {
            rating: defaultRating.rating,
            deviation: defaultRating.deviation,
            volatility: defaultRating.volatility,
            matches_played: 0,
            win_rate: 0
          }
        }
        throw fetchError
      }

      return data as PlayerRating
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar rating'
      setError(message)
      console.error('Error fetching rating:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateRatingAfterMatch = useCallback(async (
    userId: string,
    gameType: GameType,
    opponentRating: GlickoPlayer,
    result: 'win' | 'loss' | 'draw'
  ): Promise<RatingInfo | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // First fetch current rating
      const currentRating = await fetchRating(userId, gameType)
      if (!currentRating) {
        throw new Error('Não foi possível obter o rating atual')
      }

      const player: GlickoPlayer = {
        rating: Number(currentRating.rating),
        deviation: Number(currentRating.deviation),
        volatility: Number(currentRating.volatility)
      }

      // Calculate score
      const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0

      // Calculate new rating
      const ratingResult = calculateRating(player, opponentRating, score)

      // Calculate new win rate
      const newMatchesPlayed = currentRating.matches_played + 1
      const previousWins = currentRating.win_rate * currentRating.matches_played
      const newWins = previousWins + (result === 'win' ? 1 : result === 'draw' ? 0.5 : 0)
      const newWinRate = newWins / newMatchesPlayed

      // Upsert the new rating
      const { error: updateError } = await supabase
        .from('player_ratings')
        .upsert({
          user_id: userId,
          game_type: gameType,
          rating: ratingResult.newRating,
          deviation: ratingResult.newDeviation,
          volatility: ratingResult.newVolatility,
          matches_played: newMatchesPlayed,
          win_rate: newWinRate,
          last_match_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,game_type'
        })

      if (updateError) {
        throw updateError
      }

      // Build rating info for display
      const oldTier = getRankTier(player.rating)
      const newTier = getRankTier(ratingResult.newRating)
      const rankProgressInfo = getRankProgress(ratingResult.newRating)

      const ratingInfo: RatingInfo = {
        oldRating: Math.round(player.rating),
        newRating: ratingResult.newRating,
        ratingChange: ratingResult.ratingChange,
        oldTier,
        newTier,
        rankProgress: rankProgressInfo.progress,
        matchesPlayed: newMatchesPlayed,
        winRate: newWinRate
      }

      return ratingInfo
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar rating'
      setError(message)
      console.error('Error updating rating:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchRating])

  return {
    isLoading,
    error,
    fetchRating,
    updateRatingAfterMatch
  }
}

/**
 * Helper to get opponent's rating from game room state
 */
export function getOpponentRatingFromRoom(
  gameState: Record<string, unknown>,
  myUserId: string
): GlickoPlayer {
  // Try to extract opponent rating from game state
  const participants = gameState.participants as Array<{
    id: string
    rating?: number
    deviation?: number
    volatility?: number
  }> | undefined

  if (participants) {
    const opponent = participants.find(p => p.id !== myUserId)
    if (opponent && opponent.rating) {
      return {
        rating: opponent.rating,
        deviation: opponent.deviation || 350,
        volatility: opponent.volatility || 0.06
      }
    }
  }

  // Default opponent rating
  return createDefaultRating()
}
