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

const CONFETTI_EMOJIS = ['🎉', '✨', '🌟', '⭐', '💫'] as const

const normalizeGridData = (gridData: WordSearchGridCell[][] | string[][]): string[][] => {
  if (!gridData?.length) return []
  
  // Check if already normalized
  if (typeof gridData[0][0] === 'string') {
    return gridData as string[][]
  }
  
  // Transform object format to string format
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
          // Double check if we are still in duel mode before setting result
          setDuelResult(prev => {
            if (prev) return prev // Already set
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
      // Random mode: generate new puzzle
      setPuzzle(null)
      setIsTimerRunning(false)
      setTimeMs(0)
      setIsComplete(false)
      resetScoreSubmission()
      fetchPuzzle('random', selectedCategory)
    } else {
      // Daily mode: restart current puzzle
      setIsTimerRunning(true)
      setTimeMs(0)
      setIsComplete(false)
      resetScoreSubmission()
      
      // Force grid re-render
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

  // ============================================================================
  // Render Screens
  // ============================================================================

  // Category Selection Screen
  if (showCategorySelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => {
                setShowCategorySelection(false)
                setGameMode(null)
              }}
              className="mb-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Escolha um Tema
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Selecione uma categoria temática ou jogue com todas as palavras
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
              <p className="text-zinc-600 dark:text-zinc-400">A gerar puzzle...</p>
            </div>
          )}

          {/* Category Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* All Words Option */}
            <CategoryCard
              icon="🎲"
              title="Todas as Palavras"
              description="Puzzle com palavras de todos os temas"
              onClick={() => handleSelectCategory(null)}
              disabled={loading}
            />

            {/* Categories */}
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔍</div>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            A carregar puzzle...
          </p>
        </div>
      </div>
    )
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Erro ao Carregar
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <button
            onClick={handleChangeMode}
            className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:scale-105 transition-transform"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // No puzzle loaded
  if (!puzzle) return null

  // Game Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-8">
      {/* Confetti Animation */}
      {showConfetti && <ConfettiEffect />}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <GameHeader
          gameMode={gameMode}
          timeMs={timeMs}
          isTimerRunning={isTimerRunning}
          onChangeMode={handleChangeMode}
          onRestart={handleRestart}
          onTimeUpdate={setTimeMs}
        />

        {/* Daily Mode Alert */}
        {gameMode === 'daily' && puzzle.isFromPreviousDay && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Este é um puzzle anterior. O puzzle de hoje ainda não foi gerado.
            </p>
          </div>
        )}

        {/* Game Grid */}
        <WordSearchGrid
          grid={normalizedGrid}
          words={puzzle.words}
          onComplete={handleComplete}
        />

        {/* Completion Modal */}
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
      className="group relative overflow-hidden rounded-xl border-2 bg-white p-6 text-left transition-all hover:shadow-lg disabled:opacity-50 dark:bg-zinc-900"
      style={{
        borderColor: color && wordCount && wordCount >= 10 ? `${color}30` : undefined,
      }}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-110"
        style={{
          backgroundColor: color ? `${color}20` : undefined,
        }}
      >
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {wordCount !== undefined && (
        <>
          <span className="text-xs font-medium text-zinc-500">
            {wordCount} palavras
          </span>
          {isInvalid && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
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
}

function GameHeader({ 
  gameMode, 
  isTimerRunning, 
  onChangeMode, 
  onRestart,
  onTimeUpdate
}: GameHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onChangeMode}
          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          ← Mudar Modo
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow">
          <span className="text-2xl">
            {gameMode === 'daily' ? '📅' : '🎲'}
          </span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {gameMode === 'daily' ? 'Diário' : 'Aleatório'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow px-6 py-3">
          <Timer isRunning={isTimerRunning} onTimeUpdate={onTimeUpdate} />
        </div>

        <button
          onClick={onRestart}
          className="px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:scale-105 transition-transform font-semibold"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-bounce">
        <div className="text-center">
          <div className="text-7xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            Parabéns!
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2">
            Encontraste todas as palavras!
          </p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
            {formatChronometer(timeMs)}
          </p>

          {gameMode === 'daily' && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p>{statusCopy[scoreStatus]}</p>
                  {scoreStatus === 'error' && (
                    <button
                      onClick={() => onSubmitScore()}
                      className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                    >
                      Tentar novamente
                    </button>
                  )}
                  {scoreStatus === 'success' && (
                    <p className="text-xs text-amber-800/80 dark:text-amber-100/80">
                      Se jogares novamente registamos o novo tempo automaticamente.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p>
                    Entra como convidado ou liga a tua conta Google para guardares o tempo no leaderboard diário.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => onSignInAsGuest && onSignInAsGuest()}
                      className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      Entrar como Convidado
                    </button>
                    <button
                      onClick={() => onSignInWithGoogle && onSignInWithGoogle()}
                      className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
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
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
              >
                🏆 Ver Classificações
              </button>
            )}
            <button
              onClick={onRestart}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              {gameMode === 'daily' ? '↻ Reiniciar' : '🎲 Novo Puzzle'}
            </button>
            <button
              onClick={onChangeMode}
              className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-semibold transition-colors"
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
