'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import WordSearchGrid from '@/components/WordSearchGrid'
import Timer from '@/components/Timer'
import { apiFetch } from '@/lib/api-client'
import { formatChronometer } from '@/lib/utils/time'
import type { Category, GameMode, WordSearchGridCell, WordSearchPuzzle } from '@/lib/types/games'

// ============================================================================
// Types
// ============================================================================

type GameModeState = GameMode | null

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
  }, [])

  useEffect(() => {
    if (gameMode === 'daily' && !puzzle) {
      fetchPuzzle('daily')
    }
  }, [gameMode, puzzle])

  useEffect(() => {
    if (showConfetti) {
      const timeout = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [showConfetti])

  // ============================================================================
  // API Functions
  // ============================================================================

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories', {
        method: 'GET',
        cache: 'no-store',
      })
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const fetchPuzzle = async (mode: GameMode, category?: string | null) => {
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
      setIsTimerRunning(true)
      setShowCategorySelection(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSelectMode = useCallback((mode: GameMode) => {
    setGameMode(mode)
    
    if (mode === 'daily') {
      fetchPuzzle(mode)
    } else {
      setShowCategorySelection(true)
    }
  }, [])

  const handleSelectCategory = useCallback((categorySlug: string | null) => {
    setSelectedCategory(categorySlug)
    fetchPuzzle('random', categorySlug)
  }, [])

  const handleComplete = useCallback(async (foundWords: string[]) => {
    setIsTimerRunning(false)
    setIsComplete(true)
    setShowConfetti(true)

    // TODO: Save score when auth is implemented
    if (gameMode === 'daily' && puzzle) {
      console.log('Score to save:', {
        puzzle_id: puzzle.id,
        time_ms: timeMs,
        words_found: foundWords.length
      })
    }
  }, [gameMode, puzzle, timeMs])

  const handleRestart = useCallback(() => {
    if (gameMode === 'random') {
      // Random mode: generate new puzzle
      setPuzzle(null)
      setIsTimerRunning(false)
      setTimeMs(0)
      setIsComplete(false)
      fetchPuzzle('random', selectedCategory)
    } else {
      // Daily mode: restart current puzzle
      setIsTimerRunning(true)
      setTimeMs(0)
      setIsComplete(false)
      
      // Force grid re-render
      const currentPuzzle = puzzle
      setPuzzle(null)
      setTimeout(() => setPuzzle(currentPuzzle), 10)
    }
  }, [gameMode, selectedCategory, puzzle])

  const handleChangeMode = useCallback(() => {
    setGameMode(null)
    setPuzzle(null)
    setIsTimerRunning(false)
    setTimeMs(0)
    setIsComplete(false)
    setShowCategorySelection(false)
    setSelectedCategory(null)
  }, [])

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
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              🔍 Sopa de Letras
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Encontre todas as palavras escondidas no grid
            </p>
          </div>

          {/* Mode Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <ModeCard
              icon="📅"
              title="Modo Diário"
              description="Puzzle do dia igual para todos. Compete no leaderboard!"
              badge="🏆 Leaderboard Ativo"
              hoverColor="yellow"
              onClick={() => handleSelectMode('daily')}
            />

            <ModeCard
              icon="🎲"
              title="Modo Aleatório"
              description="Gera novo puzzle a cada partida. Escolhe um tema específico!"
              badge="🎨 Puzzles Temáticos"
              hoverColor="emerald"
              spin
              onClick={() => handleSelectMode('random')}
            />
          </div>

          {/* Back Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              ← Voltar ao Início
            </button>
          </div>
        </div>
      </div>
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
        {isComplete && (
          <CompletionModal
            timeMs={timeMs}
            gameMode={gameMode}
            onRestart={handleRestart}
            onChangeMode={handleChangeMode}
            onViewLeaderboard={() => router.push('/leaderboards')}
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

interface ModeCardProps {
  icon: string
  title: string
  description: string
  badge: string
  hoverColor: 'yellow' | 'emerald'
  spin?: boolean
  onClick: () => void
}

function ModeCard({ 
  icon, 
  title, 
  description, 
  badge, 
  hoverColor, 
  spin, 
  onClick 
}: ModeCardProps) {
  const hoverBorderColor = hoverColor === 'yellow' 
    ? 'hover:border-yellow-400 dark:hover:border-yellow-600'
    : 'hover:border-emerald-400 dark:hover:border-emerald-600'
    
  const badgeColor = hoverColor === 'yellow'
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-emerald-600 dark:text-emerald-400'

  return (
    <button
      onClick={onClick}
      className={`group relative p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent ${hoverBorderColor}`}
    >
      <div className={`text-6xl mb-4 ${spin ? 'group-hover:animate-spin' : 'group-hover:animate-bounce'}`}>
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4">
        {description}
      </p>
      <div className={`flex items-center justify-center gap-2 text-sm font-semibold ${badgeColor}`}>
        <span>{badge.split(' ')[0]}</span>
        <span>{badge.split(' ').slice(1).join(' ')}</span>
      </div>
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
}

function CompletionModal({ 
  timeMs, 
  gameMode, 
  onRestart, 
  onChangeMode, 
  onViewLeaderboard 
}: CompletionModalProps) {
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
