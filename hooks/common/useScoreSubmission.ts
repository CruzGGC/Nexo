import { useCallback, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { getSupabaseBrowserClient } from '@/lib/supabase'
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

    // Don't submit scores for temporary puzzles
    if (puzzleId.startsWith('temp-')) {
      setStatus('error')
      setError('Este puzzle não foi guardado no servidor. Pontuação não pode ser registada.')
      return
    }

    setStatus('saving')
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()

      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        setStatus('error')
        setError('Sessão expirada. Por favor, inicia sessão novamente.')
        return
      }

      await apiFetch('/api/scores', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
