'use client'

import { useMemo, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import CrosswordGrid from '@/components/CrosswordGrid'
import Timer from '@/components/Timer'
import { formatChronometer } from '@/lib/utils/time'
import type { Category } from '@/lib/types/games'
import { ModeSelection } from '@/components/crossword/ModeSelection'
import { CategorySelection } from '@/components/crossword/CategorySelection'
import { HowToPlay } from '@/components/crossword/HowToPlay'
import { useCrosswordGame } from '@/hooks/useCrosswordGame'
import { useAuth } from '@/components/AuthProvider'
import { useScoreSubmission } from '@/hooks/useScoreSubmission'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { MatchmakingView } from '@/components/MatchmakingView'
import { GameResultModal } from '@/components/GameResultModal'
import { apiFetch } from '@/lib/api-client'
import type { CrosswordPuzzle } from '@/lib/types/games'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const LISBON_DATE_FORMATTER = new Intl.DateTimeFormat('pt-PT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Lisbon'
})

type GameState = {
  participants?: Array<{ id: string; role: 'host' | 'guest' }>;
  progress?: Record<string, number>;
  room_code?: string;
  [key: string]: unknown;
}

function formatLisbonDate(dateString?: string | null) {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }
  return LISBON_DATE_FORMATTER.format(date)
}

interface CrosswordGameShellProps {
  initialCategories: Category[]
}

export default function CrosswordGameShell({ initialCategories }: CrosswordGameShellProps) {
  const {
    categories,
    error,
    finalTime,
    gameMode,
    handleBackToModeSelection,
    handleChangeMode,
    handleComplete,
    handleRestart,
    handleSelectCategory,
    handleSelectMode,
    handleStartGame,
    handleTimeUpdate,
    isComplete,
    isLoading,
    isPlaying,
    modeLabel,
    puzzle,
    selectedCategoryMeta,
    setPuzzle,
    showCategorySelection,
    showModeSelection,
  } = useCrosswordGame({ initialCategories })
  
  const matchmaking = useMatchmaking('crossword_duel')
  const supabase = getSupabaseBrowserClient()

  const { user, signInAsGuest, continueWithGoogle } = useAuth()
  const {
    submitScore: submitCrosswordScore,
    status: crosswordScoreStatus,
    error: crosswordScoreError,
    reset: resetCrosswordScore
  } = useScoreSubmission('crossword')
  const isAuthenticated = Boolean(user)

  const fallbackDateLabel = useMemo(() => formatLisbonDate(puzzle?.publish_date), [puzzle?.publish_date])
  const servedDateLabel = useMemo(() => formatLisbonDate(puzzle?.servedForDate), [puzzle?.servedForDate])

  const [duelResult, setDuelResult] = useState<{ result: 'victory' | 'defeat' | 'draw', winnerName?: string } | null>(null)

  useEffect(() => {
    resetCrosswordScore()
  }, [puzzle?.id, resetCrosswordScore])

  // Load puzzle when matched in duel mode
  useEffect(() => {
    if (gameMode === 'duel' && matchmaking.status === 'matched' && matchmaking.room && !puzzle) {
      const initDuel = async () => {
        const puzzleId = matchmaking.room!.puzzle_id
        const myId = user?.id
        const gameState = matchmaking.room!.game_state as unknown as GameState
        const amIHost = gameState?.participants?.find((p) => p.id === myId)?.role === 'host'
        
        if (amIHost) {
           try {
             await apiFetch('/api/crossword/duel/create', { 
               method: 'POST', 
               body: JSON.stringify({ id: puzzleId }) 
             })
           } catch (err) {
             console.error('Failed to create duel puzzle:', err)
           }
        }
        
        // Poll for puzzle
        let attempts = 0
        while (attempts < 20) {
           try {
             const data = await apiFetch<CrosswordPuzzle>(`/api/crossword/${puzzleId}`, {
                cache: 'no-store'
             })
             setPuzzle(data)
             handleStartGame()
             return
           } catch {
             await new Promise(r => setTimeout(r, 1000))
             attempts++
           }
        }
        console.error('Timeout waiting for puzzle')
      }
      void initDuel()
    }
  }, [gameMode, matchmaking.status, matchmaking.room, puzzle, setPuzzle, handleStartGame, user?.id])

  // Handle duel completion
  useEffect(() => {
    if (gameMode === 'duel' && matchmaking.room && user) {
      const gameState = matchmaking.room.game_state as unknown as GameState
      const winnerId = gameState?.winner_id as string | undefined
      
      // If I just finished, report win
      if (isComplete && !winnerId) {
        const reportWin = async () => {
          const { error } = await supabase.rpc('claim_victory', {
            p_room_id: matchmaking.room!.id
          })
            
          if (error) {
            console.error('Failed to report win:', error)
          }
        }
        void reportWin()
      }

      // Check for winner (me or opponent)
      if (winnerId && !duelResult) {
        const isMe = winnerId === user?.id
        // Assuming participants might have display_name in future, or we fetch profile. 
        // For now we don't have names easily accessible in game_state unless we put them there.
        // We can just say "Oponente" if not me.
        
        setTimeout(() => {
          setDuelResult(prev => {
            if (prev) return prev
            return {
              result: isMe ? 'victory' : 'defeat',
              winnerName: isMe ? undefined : 'Oponente'
            }
          })
        }, 0)
      }
    }
  }, [gameMode, isComplete, matchmaking.room, user, supabase, duelResult])

  const handleDailyScoreSubmit = useCallback(() => {
    if (!user?.id || !puzzle || finalTime <= 0) {
      return
    }

    void submitCrosswordScore({
      userId: user.id,
      puzzleId: puzzle.id,
      timeMs: finalTime
    })
  }, [finalTime, puzzle, submitCrosswordScore, user])

  const handleGridComplete = useCallback(() => {
    handleComplete()
    if (gameMode === 'daily') {
      handleDailyScoreSubmit()
    }
  }, [gameMode, handleComplete, handleDailyScoreSubmit])

  const crosswordStatusCopy = {
    idle: 'Guardamos automaticamente o teu tempo diário assim que completas o puzzle.',
    saving: 'A guardar o teu tempo na leaderboard diária...',
    success: 'Tempo registado! Consulta as classificações para ver a tua posição.',
    error: crosswordScoreError ?? 'Não foi possível guardar o teu tempo.'
  }

  if (gameMode === 'duel' && !puzzle) {
    return (
      <MatchmakingView
        status={matchmaking.status}
        onJoinPublic={() => matchmaking.joinQueue({ mode: 'public' })}
        onCreatePrivate={(code) => matchmaking.joinQueue({ mode: 'private', matchCode: code, seat: 'host' })}
        onJoinPrivate={(code) => matchmaking.joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })}
        onCancel={() => {
          matchmaking.leaveQueue()
          handleChangeMode()
        }}
        roomCode={(matchmaking.room?.game_state as unknown as GameState)?.room_code}
        title="Duelo de Palavras Cruzadas"
        description="Encontra um oponente e resolve o mesmo puzzle em tempo real."
      />
    )
  }

  if (duelResult) {
    return (
      <GameResultModal
        isOpen={true}
        result={duelResult.result}
        winnerName={duelResult.winnerName}
        onClose={() => {
          setDuelResult(null)
          matchmaking.leaveQueue()
          handleChangeMode()
        }}
      />
    )
  }

  if (showCategorySelection) {
    return (
      <CategorySelection
        categories={categories}
        isLoading={isLoading}
        onBack={handleBackToModeSelection}
        onSelectCategory={handleSelectCategory}
      />
    )
  }

  if (showModeSelection) {
    return (
      <ModeSelection gameMode={gameMode} isLoading={isLoading} error={error} onSelectMode={handleSelectMode} />
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
          <p className="text-zinc-600 dark:text-zinc-400">A carregar puzzle...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={handleChangeMode}
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Mudar Modo
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {modeLabel}
            </span>
            <div className="text-center">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Tempo</div>
              <Timer isRunning={isPlaying} onTimeUpdate={handleTimeUpdate} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {gameMode === 'daily' && puzzle.isFromPreviousDay && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-amber-900 shadow-sm dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-100">
            <span className="text-2xl" aria-hidden>
              ⏳
            </span>
            <div>
              <p className="font-semibold">Puzzle do dia anterior</p>
              <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
                Ainda estamos a gerar o desafio de {servedDateLabel ?? 'hoje'}. A mostrar a grelha publicada em
                {' '}
                <strong>{fallbackDateLabel ?? puzzle.publish_date}</strong> para que possas continuar a jogar.
              </p>
            </div>
          </div>
        )}

        {!isPlaying && !isComplete && (
          <HowToPlay gameMode={gameMode} puzzle={puzzle} onStart={handleStartGame} />
        )}

        {isPlaying && !isComplete && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CrosswordGrid
              grid={puzzle.grid_data}
              clues={puzzle.clues}
              onComplete={handleGridComplete}
              onCellChange={() => {}}
            />
          </div>
        )}

        {isComplete && gameMode !== 'duel' && (
          <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-300">
            <div className="mb-6 text-7xl animate-bounce">🎉</div>
            <h2 className="mb-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Parabéns!</h2>
            <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
              Completou o puzzle {gameMode === 'daily' ? 'diário' : selectedCategoryMeta ? `de ${selectedCategoryMeta.name}` : 'aleatório'} em
            </p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 mb-8 border border-zinc-100 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Tempo Final</p>
              <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {formatChronometer(finalTime)}
              </p>
            </div>

            {gameMode === 'random' && (
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Modo aleatório não conta para a leaderboard global
              </p>
            )}

            {gameMode === 'daily' && (
              <div className="mb-8 text-left text-sm">
                {isAuthenticated ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <p className="font-medium">{crosswordStatusCopy[crosswordScoreStatus]}</p>
                    {crosswordScoreStatus === 'error' && (
                      <button
                        onClick={handleDailyScoreSubmit}
                        className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-500 shadow-sm"
                      >
                        Tentar novamente
                      </button>
                    )}
                    {crosswordScoreStatus === 'success' && (
                      <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-100/80">
                        Se melhorares o tempo voltamos a atualizar automaticamente.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">
                    <p className="font-medium">
                      Entra como convidado ou liga a tua conta Google para registar o tempo nas classificações diárias.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => { void signInAsGuest() }}
                        className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 shadow-sm"
                      >
                        Entrar como Convidado
                      </button>
                      <button
                        onClick={() => { void continueWithGoogle() }}
                        className="flex-1 rounded-xl border-2 border-zinc-200 px-4 py-2.5 font-bold text-zinc-900 transition hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
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
                onClick={handleRestart}
                className="rounded-xl bg-zinc-900 px-6 py-4 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm"
              >
                {gameMode === 'daily'
                  ? 'Jogar Novamente'
                  : selectedCategoryMeta
                  ? `Novo Puzzle de ${selectedCategoryMeta.name}`
                  : 'Novo Puzzle Aleatório'}
              </button>
              {gameMode === 'daily' && (
                <Link
                  href="/leaderboards"
                  className="rounded-xl bg-yellow-400 px-6 py-4 font-bold text-zinc-900 transition-all hover:-translate-y-0.5 hover:bg-yellow-500 shadow-sm text-center"
                >
                  Ver Classificações
                </Link>
              )}
              <button
                onClick={handleChangeMode}
                className="rounded-xl bg-transparent px-6 py-4 font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Mudar Modo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
