'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WordSearchGrid from '@/components/WordSearchGrid'
import Timer from '@/components/Timer'
import type { WordPlacement } from '@/lib/wordsearch-generator'

type GameMode = 'daily' | 'random' | null

interface Puzzle {
  id: string
  type: string
  grid_data: string[][]
  words: WordPlacement[]
  publish_date: string
  isFromPreviousDay?: boolean
}

export default function WordSearchPage() {
  const router = useRouter()
  const [gameMode, setGameMode] = useState<GameMode>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timeMs, setTimeMs] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Buscar puzzle quando modo é selecionado
  useEffect(() => {
    if (gameMode && !puzzle) {
      fetchPuzzle(gameMode)
    }
  }, [gameMode])

  const fetchPuzzle = async (mode: 'daily' | 'random') => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = mode === 'daily' 
        ? '/api/wordsearch/daily' 
        : '/api/wordsearch/random'
      
      const response = await fetch(endpoint)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar puzzle')
      }

      setPuzzle(data)
      setIsTimerRunning(true)
    } catch (err) {
      console.error('Erro ao buscar puzzle:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (foundWords: string[]) => {
    setIsTimerRunning(false)
    setIsComplete(true)
    setShowConfetti(true)

    // Remover confetti após 5 segundos
    setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    // Se modo diário, salvar pontuação (implementar depois com auth)
    if (gameMode === 'daily' && puzzle) {
      // TODO: Implementar salvamento de score quando auth estiver pronto
      console.log('Score para salvar:', {
        puzzle_id: puzzle.id,
        time_ms: timeMs,
        words_found: foundWords.length
      })
    }
  }

  const handleRestart = () => {
    if (gameMode === 'random') {
      // Modo aleatório: gerar novo puzzle
      setPuzzle(null)
      setIsTimerRunning(false)
      setTimeMs(0)
      setIsComplete(false)
      fetchPuzzle('random')
    } else {
      // Modo diário: reiniciar puzzle atual
      setIsTimerRunning(true)
      setTimeMs(0)
      setIsComplete(false)
      // Force re-render do grid
      const currentPuzzle = puzzle
      setPuzzle(null)
      setTimeout(() => setPuzzle(currentPuzzle), 10)
    }
  }

  const handleChangeMode = () => {
    setGameMode(null)
    setPuzzle(null)
    setIsTimerRunning(false)
    setTimeMs(0)
    setIsComplete(false)
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
  }

  // Tela de seleção de modo
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              🔍 Sopa de Letras
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Encontre todas as palavras escondidas no grid
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Modo Diário */}
            <button
              onClick={() => setGameMode('daily')}
              className="group relative p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-yellow-400 dark:hover:border-yellow-600"
            >
              <div className="text-6xl mb-4 group-hover:animate-bounce">📅</div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Modo Diário
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Puzzle do dia igual para todos. Compete no leaderboard!
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                <span>🏆</span>
                <span>Leaderboard Ativo</span>
              </div>
            </button>

            {/* Modo Aleatório */}
            <button
              onClick={() => setGameMode('random')}
              className="group relative p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-emerald-400 dark:hover:border-emerald-600"
            >
              <div className="text-6xl mb-4 group-hover:animate-spin">🎲</div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Modo Aleatório
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Gera novo puzzle a cada partida. Perfeito para praticar!
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>♾️</span>
                <span>Puzzles Ilimitados</span>
              </div>
            </button>
          </div>

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

  // Loading state
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

  // Error state
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

  // Game screen
  if (!puzzle) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 sm:p-8">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                fontSize: `${20 + Math.random() * 20}px`,
              }}
            >
              {['🎉', '✨', '🌟', '⭐', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleChangeMode}
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
            {/* Timer */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow px-6 py-3">
              <Timer
                isRunning={isTimerRunning}
                onTimeUpdate={setTimeMs}
              />
            </div>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:scale-105 transition-transform font-semibold"
              title={gameMode === 'daily' ? 'Reiniciar' : 'Novo Puzzle'}
            >
              {gameMode === 'daily' ? '↻' : '🎲'}
            </button>
          </div>
        </div>

        {/* Daily mode alert */}
        {gameMode === 'daily' && puzzle.isFromPreviousDay && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Este é um puzzle anterior. O puzzle de hoje ainda não foi gerado.
            </p>
          </div>
        )}

        {/* Grid */}
        <WordSearchGrid
          grid={puzzle.grid_data}
          words={puzzle.words}
          onComplete={handleComplete}
        />

        {/* Completion Modal */}
        {isComplete && (
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
                  {formatTime(timeMs)}
                </p>

                <div className="flex flex-col gap-3">
                  {gameMode === 'daily' && (
                    <button
                      onClick={() => router.push('/leaderboards')}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      🏆 Ver Classificações
                    </button>
                  )}
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {gameMode === 'daily' ? '↻ Reiniciar' : '🎲 Novo Puzzle'}
                  </button>
                  <button
                    onClick={handleChangeMode}
                    className="px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-semibold transition-colors"
                  >
                    Mudar Modo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
