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
import { motion, AnimatePresence } from 'framer-motion'

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
                Completou o puzzle {gameMode === 'daily' ? 'diário' : selectedCategoryMeta ? `de ${selectedCategoryMeta.name}` : 'aleatório'} em
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
                      <p className="font-medium">{crosswordStatusCopy[crosswordScoreStatus]}</p>
                      {crosswordScoreStatus === 'error' && (
                        <button
                          onClick={() => {
                            handleDailyScoreSubmit()
                          }}
                          className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                        >
                          Tentar novamente
                        </button>
                      )}
                      {crosswordScoreStatus === 'success' && (
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
                          onClick={() => {
                            void signInAsGuest()
                          }}
                          className="flex-1 rounded-xl bg-white text-black px-4 py-3 font-bold transition hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                          Entrar como Convidado
                        </button>
                        <button
                          onClick={() => {
                            void continueWithGoogle()
                          }}
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
                  onClick={() => {
                    handleRestart()
                  }}
                  className="rounded-xl bg-[#00f3ff] px-6 py-4 font-bold text-black transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]"
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
                    className="rounded-xl bg-[#bc13fe] px-6 py-4 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] text-center"
                  >
                    Ver Classificações
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleChangeMode()
                  }}
                  className="rounded-xl bg-transparent px-6 py-4 font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
                >
                  Mudar Modo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
