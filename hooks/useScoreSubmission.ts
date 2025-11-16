import { useCallback, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import type { ScoreGameType } from '@/lib/types/games'

type SubmissionStatus = 'idle' | 'saving' | 'success' | 'error'

interface SubmitScorePayload {
  userId: string
  puzzleId: string
  timeMs: number
}

export function useScoreSubmission(gameType: ScoreGameType) {
  const [status, setStatus] = useState<SubmissionStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const submitScore = useCallback(async ({ userId, puzzleId, timeMs }: SubmitScorePayload) => {
    if (!userId || !puzzleId || timeMs <= 0) {
      setStatus('error')
      setError('Dados inválidos para guardar pontuação.')
      return
    }

    setStatus('saving')
    setError(null)

    try {
      await apiFetch('/api/scores', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          puzzle_id: puzzleId,
          time_ms: timeMs,
          game_type: gameType,
        }),
      })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erro ao guardar pontuação.')
    }
  }, [gameType])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return {
    status,
    error,
    submitScore,
    reset,
  }
}

export type { SubmissionStatus }
