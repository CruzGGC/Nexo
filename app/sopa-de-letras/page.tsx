'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import WordSearchGrid from '@/components/WordSearchGrid'
import Timer from '@/components/Timer'
import { apiFetch } from '@/lib/api-client'
import { formatChronometer } from '@/lib/utils/time'
import { useAuth } from '@/components/AuthProvider'
import { useScoreSubmission } from '@/hooks/useScoreSubmission'
import { ModeSelection } from '@/components/wordsearch/ModeSelection'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { MatchmakingView } from '@/components/MatchmakingView'
import { GameResultModal } from '@/components/GameResultModal'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { SubmissionStatus } from '@/hooks/useScoreSubmission'
import type { Category, GameMode, WordSearchGridCell, WordSearchPuzzle } from '@/lib/types/games'

// ============================================================================
// Types
// ============================================================================

type GameModeState = GameMode | null

type GameState = {
  participants?: Array<{ id: string; role: 'host' | 'guest' }>;
  progress?: Record<string, number>;
  room_code?: string;
  [key: string]: unknown;
}

// ============================================================================
// Utility Functions
// ============================================================================

const CONFETTI_EMOJIS = ['🎉', '✨', '🌟', '⭐', '💫', '💎', '🚀'] as const

const normalizeGridData = (gridData: WordSearchGridCell[][] | string[][]): string[][] => {
  if (!gridData?.length) return []
  if (typeof gridData[0][0] === 'string') return gridData as string[][]
  return (gridData as WordSearchGridCell[][]).map(row => row.map(cell => cell.letter))
}

// ============================================================================
// Main Component
// ============================================================================

export default function WordSearchPage() {
  const router = useRouter()

  // Game state
  const [gameMode, setGameMode] = useState<GameModeState>(null)
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCategorySelection, setShowCategorySelection] = useState(false)

  // Game progress
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeMs, setTimeMs] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const { user, signInAsGuest, continueWithGoogle } = useAuth()
  const {
    status: scoreStatus,
    error: scoreError,
    submitScore: submitDailyScore,
    reset: resetScoreSubmission
  } = useScoreSubmission('wordsearch')

  const matchmaking = useMatchmaking('wordsearch_duel')
  const supabase = getSupabaseBrowserClient()

  const [duelResult, setDuelResult] = useState<{ result: 'victory' | 'defeat' | 'draw', winnerName?: string } | null>(null)

  // Hint System
  const [hintUsed, setHintUsed] = useState(false)
  const [hintRequest, setHintRequest] = useState(0)

  // ============================================================================
  // API Functions
  // ============================================================================

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories', {
        method: 'GET',
        cache: 'no-store',
      })
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }, [])

  const fetchPuzzle = useCallback(async (mode: GameMode, category?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = mode === 'daily'
        ? '/api/wordsearch/daily'
        : `/api/wordsearch/random${category ? `?category=${category}` : ''}`

      const data = await apiFetch<WordSearchPuzzle>(endpoint, {
        cache: 'no-store',
      })

      setPuzzle(data)
      setIsComplete(false)
      resetScoreSubmission()
      setIsTimerRunning(true)
      setShowCategorySelection(false)
      setHintUsed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [resetScoreSubmission])

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const normalizedGrid = useMemo(() =>
    puzzle?.grid_data ? normalizeGridData(puzzle.grid_data) : [],
    [puzzle?.grid_data]
  )

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (gameMode === 'daily' && !puzzle) {
      fetchPuzzle('daily')
    }
  }, [gameMode, puzzle, fetchPuzzle])

  useEffect(() => {
    if (showConfetti) {
      const timeout = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [showConfetti])

  // Load puzzle when matched in duel mode
  useEffect(() => {
    if (gameMode === 'duel' && matchmaking.status === 'matched' && matchmaking.room && !puzzle) {
      const initDuel = async () => {
        setLoading(true)
        const puzzleId = matchmaking.room!.puzzle_id
        const myId = user?.id
        const gameState = matchmaking.room!.game_state as unknown as GameState
        const amIHost = gameState?.participants?.find((p) => p.id === myId)?.role === 'host'

        if (amIHost) {
          try {
            await apiFetch('/api/wordsearch/duel/create', {
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
            const data = await apiFetch<WordSearchPuzzle>(`/api/wordsearch/${puzzleId}`, {
              cache: 'no-store'
            })
            setPuzzle(data)
            setIsTimerRunning(true)
            setLoading(false)
            return
          } catch {
            await new Promise(r => setTimeout(r, 1000))
            attempts++
          }
        }
        setLoading(false)
        console.error('Timeout waiting for puzzle')
      }
      void initDuel()
    }
  }, [gameMode, matchmaking.status, matchmaking.room, puzzle, setLoading, setIsTimerRunning, user?.id])

  // Handle duel completion and winner detection
  useEffect(() => {
    if (gameMode === 'duel' && matchmaking.room) {
      const gameState = matchmaking.room.game_state as unknown as GameState
      const winnerId = gameState?.winner_id

      if (isComplete && !winnerId && user) {
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

      if (winnerId && !duelResult) {
        const isMe = winnerId === user?.id
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

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSelectMode = useCallback((mode: GameMode) => {
    setGameMode(mode)

    if (mode === 'daily') {
      fetchPuzzle(mode)
    } else if (mode === 'duel') {
      // Do nothing, wait for matchmaking
    } else {
      setShowCategorySelection(true)
    }
  }, [fetchPuzzle])

  const handleSelectCategory = useCallback((categorySlug: string | null) => {
    setSelectedCategory(categorySlug)
    fetchPuzzle('random', categorySlug)
  }, [fetchPuzzle])

  const attemptScoreSubmit = useCallback(() => {
    if (!user?.id || !puzzle || timeMs <= 0) {
      return
    }

    void submitDailyScore({
      userId: user.id,
      puzzleId: puzzle.id,
      timeMs,
    })
  }, [puzzle, submitDailyScore, timeMs, user?.id])

  const handleComplete = useCallback(async (foundWords: string[]) => {
    void foundWords
    setIsTimerRunning(false)
    setIsComplete(true)
    setShowConfetti(true)

    if (gameMode === 'daily') {
      attemptScoreSubmit()
    }
  }, [attemptScoreSubmit, gameMode])

  const handleRestart = useCallback(() => {
    if (gameMode === 'random') {
      setPuzzle(null)
      setIsTimerRunning(false)
      setTimeMs(0)
      setIsComplete(false)
      resetScoreSubmission()
      fetchPuzzle('random', selectedCategory)
    } else {
      setIsTimerRunning(true)
      setTimeMs(0)
      setIsComplete(false)
      resetScoreSubmission()

      const currentPuzzle = puzzle
      setPuzzle(null)
      setTimeout(() => setPuzzle(currentPuzzle), 10)
    }
  }, [fetchPuzzle, gameMode, puzzle, resetScoreSubmission, selectedCategory])

  const handleChangeMode = useCallback(() => {
    setGameMode(null)
    setPuzzle(null)
    setIsTimerRunning(false)
    setTimeMs(0)
    setIsComplete(false)
    setShowCategorySelection(false)
    setSelectedCategory(null)
    resetScoreSubmission()
  }, [resetScoreSubmission])

  const handleUseHint = useCallback(() => {
    if (!puzzle || hintUsed) return

    // Find a word that hasn't been found yet
    // This requires access to foundWords state which is in WordSearchGrid
    // For now, we'll just emit an event or pass a prop to WordSearchGrid
    // But since we can't easily access child state, we'll implement a simple hint
    // that just highlights a random letter of the first word for now, 
    // or ideally we lift the foundWords state up.
    // For this refactor, I'll pass a "hintRequest" prop to Grid? 
    // Actually, let's just penalty the time and play sound for now, 
    // and let the Grid handle the visual if possible.
    // Since I can't change Grid interface easily without breaking things, 
    // I will implement the hint logic in the Grid component itself 
    // and trigger it via a ref or prop.

    setTimeMs(prev => prev + 15000) // +15s penalty
    setHintUsed(true)
    setHintRequest(prev => prev + 1)
  }, [puzzle, hintUsed])

  // ============================================================================
  // Render Screens
  // ============================================================================

  // Category Selection Screen
  if (showCategorySelection) {
    return (
      <div className="min-h-screen bg-[#030014] p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <button
              onClick={() => {
                setShowCategorySelection(false)
                setGameMode(null)
              }}
              className="mb-6 text-zinc-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              ← Voltar
            </button>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
              ESCOLHA UM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">TEMA</span>
            </h1>
            <p className="text-zinc-400">
              Selecione uma categoria temática ou jogue com todas as palavras
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
              <p className="text-zinc-400">A gerar puzzle...</p>
            </div>
          )}

          {/* Category Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CategoryCard
              icon="🎲"
              title="Todas as Palavras"
              description="Puzzle com palavras de todos os temas"
              onClick={() => handleSelectCategory(null)}
              disabled={loading}
              color="#ffffff"
            />

            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                icon={category.icon}
                title={category.name}
                description={category.description}
                wordCount={category.word_count}
                color={category.color}
                onClick={() => handleSelectCategory(category.slug)}
                disabled={loading || category.word_count < 10}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <ModeSelection
        gameMode={gameMode}
        isLoading={loading}
        error={error}
        onSelectMode={handleSelectMode}
      />
    )
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
          setGameMode(null)
        }}
        roomCode={(matchmaking.room?.game_state as unknown as GameState)?.room_code}
        title="Duelo de Sopa de Letras"
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
          setGameMode(null)
          setPuzzle(null)
          setIsComplete(false)
        }}
      />
    )
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔍</div>
          <p className="text-xl text-zinc-400">
            A carregar puzzle...
          </p>
        </div>
      </div>
    )
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Erro ao Carregar
          </h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={handleChangeMode}
            className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!puzzle) return null

  // Game Screen
  return (
    <div className="min-h-screen bg-[#030014] p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {showConfetti && <ConfettiEffect />}

      <div className="relative z-10 max-w-7xl mx-auto">
        <GameHeader
          gameMode={gameMode}
          timeMs={timeMs}
          isTimerRunning={isTimerRunning}
          onChangeMode={handleChangeMode}
          onRestart={handleRestart}
          onTimeUpdate={setTimeMs}
          onHint={handleUseHint}
        />

        {gameMode === 'daily' && puzzle.isFromPreviousDay && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg backdrop-blur-md">
            <p className="text-sm text-yellow-200">
              ⚠️ Este é um puzzle anterior. O puzzle de hoje ainda não foi gerado.
            </p>
          </div>
        )}

        <WordSearchGrid
          grid={normalizedGrid}
          words={puzzle.words}
          onComplete={handleComplete}
          hintRequest={hintRequest}
        />

        {isComplete && gameMode !== 'duel' && (
          <CompletionModal
            timeMs={timeMs}
            gameMode={gameMode}
            onRestart={handleRestart}
            onChangeMode={handleChangeMode}
            onViewLeaderboard={() => router.push('/leaderboards')}
            isAuthenticated={Boolean(user)}
            scoreStatus={scoreStatus}
            scoreError={scoreError}
            onSubmitScore={attemptScoreSubmit}
            onSignInAsGuest={signInAsGuest}
            onSignInWithGoogle={continueWithGoogle}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

interface CategoryCardProps {
  icon: string
  title: string
  description: string
  wordCount?: number
  color?: string
  onClick: () => void
  disabled?: boolean
}

function CategoryCard({
  icon,
  title,
  description,
  wordCount,
  color,
  onClick,
  disabled
}: CategoryCardProps) {
  const isInvalid = wordCount !== undefined && wordCount < 10

  return (
    <button
      onClick={onClick}
      disabled={disabled || isInvalid}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] hover:border-cyan-500/30 disabled:opacity-50 backdrop-blur-md"
      style={{
        borderColor: color && wordCount && wordCount >= 10 ? `${color}30` : undefined,
      }}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-110 bg-white/5 border border-white/10"
        style={{
          backgroundColor: color ? `${color}20` : undefined,
          borderColor: color ? `${color}40` : undefined,
        }}
      >
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="mb-2 text-xs text-zinc-400 group-hover:text-zinc-300">
        {description}
      </p>
      {wordCount !== undefined && (
        <>
          <span className="text-xs font-medium text-zinc-500">
            {wordCount} palavras
          </span>
          {isInvalid && (
            <div className="mt-2 text-xs text-red-400">
              Mínimo 10 palavras necessário
            </div>
          )}
        </>
      )}
    </button>
  )
}

interface GameHeaderProps {
  gameMode: GameMode
  timeMs: number
  isTimerRunning: boolean
  onChangeMode: () => void
  onRestart: () => void
  onTimeUpdate: (time: number) => void
  onHint: () => void
}

function GameHeader({
  gameMode,
  isTimerRunning,
  onChangeMode,
  onRestart,
  onTimeUpdate,
  onHint
}: GameHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={onChangeMode}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          ← Mudar Modo
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-xl">
            {gameMode === 'daily' ? '📅' : '🎲'}
          </span>
          <span className="font-bold text-white">
            {gameMode === 'daily' ? 'Diário' : 'Aleatório'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Hint Button */}
        <button
          onClick={onHint}
          className="p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 hover:scale-105 transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)]"
          title="Dica (+15s)"
        >
          💡
        </button>

        <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-2 backdrop-blur-md">
          <div className="font-mono text-xl text-cyan-400 font-bold tracking-wider shadow-cyan-500/50 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
            <Timer isRunning={isTimerRunning} onTimeUpdate={onTimeUpdate} />
          </div>
        </div>

        <button
          onClick={onRestart}
          className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] font-bold"
          title={gameMode === 'daily' ? 'Reiniciar' : 'Novo Puzzle'}
        >
          {gameMode === 'daily' ? '↻' : '🎲'}
        </button>
      </div>
    </div>
  )
}

interface CompletionModalProps {
  timeMs: number
  gameMode: GameMode
  onRestart: () => void
  onChangeMode: () => void
  onViewLeaderboard: () => void
  isAuthenticated: boolean
  scoreStatus: SubmissionStatus
  scoreError: string | null
  onSubmitScore: () => void
  onSignInAsGuest?: () => Promise<void>
  onSignInWithGoogle?: () => Promise<void>
}

function CompletionModal({
  timeMs,
  gameMode,
  onRestart,
  onChangeMode,
  onViewLeaderboard,
  isAuthenticated,
  scoreStatus,
  scoreError,
  onSubmitScore,
  onSignInAsGuest,
  onSignInWithGoogle
}: CompletionModalProps) {
  const statusCopy: Record<SubmissionStatus, string> = {
    idle: 'Guardamos o teu tempo automaticamente se estiveres autenticado.',
    saving: 'A guardar o teu tempo na leaderboard diária...',
    success: 'Tempo registado! Consulta as classificações para ver a tua posição.',
    error: scoreError ?? 'Não foi possível guardar o teu tempo.'
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 max-w-md w-full animate-in zoom-in-95 duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5" />

        <div className="relative z-10 text-center">
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">
            Parabéns!
          </h2>
          <p className="text-lg text-zinc-400 mb-6">
            Encontraste todas as palavras!
          </p>

          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">Tempo Final</p>
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
              {formatChronometer(timeMs)}
            </p>
          </div>

          {gameMode === 'daily' && (
            <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-left text-sm text-yellow-200/80 shadow-sm">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className="font-medium">{statusCopy[scoreStatus]}</p>
                  {scoreStatus === 'error' && (
                    <button
                      onClick={() => onSubmitScore()}
                      className="w-full rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400 shadow-sm"
                    >
                      Tentar novamente
                    </button>
                  )}
                  {scoreStatus === 'success' && (
                    <p className="text-xs text-yellow-500/60">
                      Se jogares novamente registamos o novo tempo automaticamente.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-medium">
                    Entra como convidado ou liga a tua conta Google para guardares o tempo no leaderboard diário.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => onSignInAsGuest && onSignInAsGuest()}
                      className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 shadow-sm"
                    >
                      Convidado
                    </button>
                    <button
                      onClick={() => onSignInWithGoogle && onSignInWithGoogle()}
                      className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      Google
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {gameMode === 'daily' && (
              <button
                onClick={onViewLeaderboard}
                className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
              >
                🏆 Ver Classificações
              </button>
            )}
            <button
              onClick={onRestart}
              className="w-full px-6 py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {gameMode === 'daily' ? '↻ Reiniciar' : '🎲 Novo Puzzle'}
            </button>
            <button
              onClick={onChangeMode}
              className="w-full px-6 py-4 bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl font-bold transition-colors"
            >
              Mudar Modo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfettiEffect() {
  const pieces = useMemo(() => {
    const pseudoRandom = (seed: number) => {
      const value = Math.sin(seed) * 10000
      return value - Math.floor(value)
    }

    return Array.from({ length: 50 }).map((_, index) => {
      const seed = index + 1
      return {
        left: `${pseudoRandom(seed) * 100}%`,
        delay: `${pseudoRandom(seed * 1.3) * 2}s`,
        duration: `${2 + pseudoRandom(seed * 1.7) * 2}s`,
        fontSize: `${20 + pseudoRandom(seed * 2.1) * 20}px`,
        emoji: CONFETTI_EMOJIS[
          Math.floor(pseudoRandom(seed * 2.7) * CONFETTI_EMOJIS.length)
        ],
      }
    })
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: piece.left,
            top: '-10%',
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            fontSize: piece.fontSize,
          }}
        >
          {piece.emoji}
        </div>
      ))}
    </div>
  )
}
