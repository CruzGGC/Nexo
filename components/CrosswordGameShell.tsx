'use client'

import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import CrosswordGrid from '@/components/CrosswordGrid'
import { Timer } from '@/components/common'
import type { Category } from '@/lib/types/games'
import { ModeSelection, CategorySelection, HowToPlay, CompletionModal } from '@/components/crossword'
import { useCrosswordGame } from '@/hooks/crossword'
import { useAuth } from '@/components/auth'
import { useScoreSubmission } from '@/hooks/common'
import { useMatchmaking } from '@/hooks/matchmaking'
import { MatchmakingView } from '@/components/MatchmakingView'
import { GameResultModal } from '@/components/common'
import { DuelGameLayout } from '@/components/DuelGameLayout'
import { apiFetch } from '@/lib/api-client'
import type { CrosswordPuzzle } from '@/lib/types/games'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import type { Json } from '@/lib/supabase'

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
  const [duelError, setDuelError] = useState<string | null>(null)
  const hasReportedCompleteRef = useRef(false)

  // Duel progress tracking
  const [myProgress, setMyProgress] = useState(0)

  // Duel derived state
  const duelRoomState = useMemo(() => {
    if (gameMode !== 'duel' || !matchmaking.room) return null
    return matchmaking.room.game_state as unknown as GameState
  }, [gameMode, matchmaking.room])

  const duelOpponent = useMemo(() => {
    if (!duelRoomState || !user) return null
    const participants = duelRoomState.participants || []
    const opponentParticipant = participants.find(p => p.id !== user.id)
    const opponentProgress = duelRoomState.progress?.[opponentParticipant?.id || ''] || 0
    
    return opponentParticipant ? {
      id: opponentParticipant.id,
      displayName: 'Oponente',
      progress: opponentProgress
    } : null
  }, [duelRoomState, user])

  // Reset completion guard when puzzle changes
  // Progress is reset via key-based remount or derived state
  const puzzleIdRef = useRef(puzzle?.id)
  useEffect(() => {
    if (puzzleIdRef.current !== puzzle?.id) {
      hasReportedCompleteRef.current = false
      puzzleIdRef.current = puzzle?.id
      // Use timeout to avoid sync setState in effect body
      const timer = setTimeout(() => setMyProgress(0), 0)
      return () => clearTimeout(timer)
    }
  }, [puzzle?.id])

  useEffect(() => {
    resetCrosswordScore()
  }, [puzzle?.id, resetCrosswordScore])

  // Load puzzle when matched in duel mode
  useEffect(() => {
    if (gameMode === 'duel' && matchmaking.status === 'matched' && matchmaking.room && !puzzle) {
      const initDuel = async () => {
        setDuelError(null) // Clear previous errors
        
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
            setDuelError('Não foi possível criar o puzzle do duelo. Por favor tenta novamente.')
            return
          }
        }

        // Poll for puzzle with error handling
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
        setDuelError('Tempo limite atingido ao carregar o puzzle. Verifica a tua ligação.')
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
            setDuelError('Não foi possível registar a vitória. O resultado pode não ser contabilizado.')
          }
        }
        void reportWin()
      }

      // Check for winner (me or opponent)
      if (winnerId && !duelResult) {
        const isMe = winnerId === user?.id

        setTimeout(() => {
          setDuelResult(prev => {
            if (prev) return prev
            const result = isMe ? 'victory' : 'defeat'

            return {
              result,
              winnerName: isMe ? undefined : 'Oponente'
            }
          })
        }, 0)
      }
    }
  }, [gameMode, isComplete, matchmaking.room, user, supabase, duelResult])

  // Track cell progress for duel mode
  const handleCellProgressChange = useCallback((filledCells: number, totalCells: number) => {
    if (!puzzle) return
    
    const progress = totalCells > 0 ? (filledCells / totalCells) * 100 : 0
    setMyProgress(progress)

    // Sync progress to server in duel mode
    if (gameMode === 'duel' && matchmaking.room && user) {
      void matchmaking.updateRoomState((current) => {
        const currentState = (current as unknown as GameState) || {}
        return {
          ...currentState,
          progress: {
            ...(currentState.progress || {}),
            [user.id]: progress
          }
        } as unknown as Json
      })
    }
  }, [gameMode, matchmaking, puzzle, user])

  const handleDailyScoreSubmit = useCallback(() => {
    if (!user?.id || !puzzle || finalTime <= 0) {
      return
    }

    // Don't submit scores for temporary puzzles (those that failed to save)
    if (puzzle.id.startsWith('temp-')) {
      console.warn('Cannot submit score for temporary puzzle')
      return
    }

    void submitCrosswordScore({
      userId: user.id,
      puzzleId: puzzle.id,
      timeMs: finalTime
    })
  }, [finalTime, puzzle, submitCrosswordScore, user])

  const handleGridComplete = useCallback(() => {
    // Prevent double-firing of completion
    if (hasReportedCompleteRef.current) return
    hasReportedCompleteRef.current = true
    
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
      <>
        {duelError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 shadow-lg backdrop-blur-md">
              <p className="font-medium">{duelError}</p>
              <button
                onClick={() => setDuelError(null)}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
        <div className="min-h-screen w-full bg-[#030014] relative overflow-hidden px-4 py-8">
          {/* Background Ambience */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow delay-1000" />
          </div>

          <MatchmakingView
            status={matchmaking.status}
            onJoinPublic={() => {
              matchmaking.joinQueue({ mode: 'public' })
            }}
            onCreatePrivate={(code) => {
              matchmaking.joinQueue({ mode: 'private', matchCode: code, seat: 'host' })
            }}
            onJoinPrivate={(code) => {
              matchmaking.joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })
            }}
            onCancel={() => {
              void matchmaking.resetMatch()
              handleChangeMode()
            }}
            roomCode={(matchmaking.room?.game_state as unknown as GameState)?.room_code}
          />
        </div>
      </>
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
          void matchmaking.resetMatch()
          handleChangeMode()
        }}
      />
    )
  }

  // Duel Game Screen with DuelGameLayout
  if (gameMode === 'duel' && puzzle && isPlaying) {
    return (
      <DuelGameLayout
        myPlayer={{
          id: user?.id || 'me',
          displayName: user?.user_metadata?.display_name || 'Tu',
          avatarUrl: user?.user_metadata?.avatar_url,
          progress: myProgress
        }}
        opponent={duelOpponent || undefined}
        timeMs={finalTime}
        gameTitle="Palavras Cruzadas"
        isComplete={isComplete}
        winner={isComplete && myProgress >= 100 ? 'me' : isComplete ? 'opponent' : null}
        onLeave={() => {
          void matchmaking.resetMatch()
          handleChangeMode()
        }}
      >
        <Timer isRunning={isPlaying && !isComplete} onTimeUpdate={handleTimeUpdate} />
        <CrosswordGrid
          grid={puzzle.grid_data}
          clues={puzzle.clues}
          onComplete={handleGridComplete}
          onCellChange={handleCellProgressChange}
        />
      </DuelGameLayout>
    )
  }

  if (showCategorySelection) {
    return (
      <CategorySelection
        categories={categories}
        isLoading={isLoading}
        onBack={() => {
          handleBackToModeSelection()
        }}
        onSelectCategory={(cat) => {
          handleSelectCategory(cat)
        }}
      />
    )
  }

  if (showModeSelection) {
    return (
      <ModeSelection
        gameMode={gameMode}
        isLoading={isLoading}
        error={error}
        onSelectMode={(mode) => {
          handleSelectMode(mode)
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030014]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.5)]" />
          <p className="text-zinc-400">A carregar puzzle...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-x-hidden selection:bg-[#00f3ff]/30">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#bc13fe]/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00f3ff]/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => {
              handleChangeMode()
            }}
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Mudar Modo
          </button>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md">
              {modeLabel}
            </span>

            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Tempo</div>
              <Timer isRunning={isPlaying} onTimeUpdate={handleTimeUpdate} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {gameMode === 'daily' && puzzle.isFromPreviousDay && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.1)] backdrop-blur-md"
          >
            <span className="text-2xl" aria-hidden>
              ⏳
            </span>
            <div>
              <p className="font-semibold text-amber-100">Puzzle do dia anterior</p>
              <p className="text-sm text-amber-200/80">
                Ainda estamos a gerar o desafio de {servedDateLabel ?? 'hoje'}. A mostrar a grelha publicada em
                {' '}
                <strong>{fallbackDateLabel ?? puzzle.publish_date}</strong> para que possas continuar a jogar.
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!isPlaying && !isComplete && (
            <motion.div
              key="how-to-play"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <HowToPlay
                gameMode={gameMode}
                puzzle={puzzle}
                onStart={() => {
                  handleStartGame()
                }}
              />
            </motion.div>
          )}

          {isPlaying && !isComplete && (
            <motion.div
              key="game-grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md"
            >
              <CrosswordGrid
                grid={puzzle.grid_data}
                clues={puzzle.clues}
                onComplete={handleGridComplete}
                onCellChange={() => { }}
              />
            </motion.div>
          )}

          {isComplete && gameMode !== 'duel' && (
            <CompletionModal
              gameMode={gameMode}
              finalTime={finalTime}
              categoryName={selectedCategoryMeta?.name}
              isAuthenticated={isAuthenticated}
              scoreStatus={crosswordScoreStatus}
              statusMessages={crosswordStatusCopy}
              onRetrySubmit={handleDailyScoreSubmit}
              onRestart={handleRestart}
              onChangeMode={handleChangeMode}
              onSignInAsGuest={() => void signInAsGuest()}
              onContinueWithGoogle={() => void continueWithGoogle()}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
