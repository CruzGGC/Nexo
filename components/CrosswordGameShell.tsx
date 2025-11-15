'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CrosswordGrid from '@/components/CrosswordGrid'
import Timer from '@/components/Timer'
import { apiFetch } from '@/lib/api-client'
import { formatChronometer } from '@/lib/utils/time'
import type { Category, CrosswordPuzzle, GameMode } from '@/lib/types/games'

interface CrosswordGameShellProps {
  initialCategories: Category[]
}

export default function CrosswordGameShell({ initialCategories }: CrosswordGameShellProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [gameMode, setGameMode] = useState<GameMode>('daily')
  const [isLoading, setIsLoading] = useState(false)
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [finalTime, setFinalTime] = useState(0)
  const [showModeSelection, setShowModeSelection] = useState(true)
  const [showCategorySelection, setShowCategorySelection] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  useEffect(() => {
    if (!initialCategories.length) {
      refreshCategories()
    }
  }, [initialCategories.length])

  const selectedCategoryMeta = useMemo(
    () => categories.find((category) => category.slug === selectedCategory),
    [categories, selectedCategory]
  )

  const refreshCategories = async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories', {
        method: 'GET',
        cache: 'no-store',
      })
      setCategories(data)
    } catch (err) {
      console.error('Erro ao atualizar categorias:', err)
    }
  }

  const fetchPuzzle = async (mode: GameMode, category?: string | null) => {
    setIsLoading(true)
    setError(null)

    try {
      let endpoint = mode === 'daily' ? '/api/crossword/daily' : '/api/crossword/random'
      if (category) {
        endpoint += `?category=${category}`
      }

      const data = await apiFetch<CrosswordPuzzle>(endpoint, {
        cache: 'no-store',
      })

      setPuzzle(data)
      setShowModeSelection(false)
      setShowCategorySelection(false)
    } catch (err) {
      console.error('Erro ao buscar puzzle:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar puzzle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMode = async (mode: GameMode) => {
    setGameMode(mode)
    if (mode === 'daily') {
      await fetchPuzzle(mode)
    } else {
      if (!categories.length) {
        await refreshCategories()
      }
      setShowCategorySelection(true)
      setShowModeSelection(false)
    }
  }

  const handleSelectCategory = async (categorySlug: string | null) => {
    setSelectedCategory(categorySlug)
    await fetchPuzzle('random', categorySlug)
  }

  const handleStartGame = () => {
    setIsPlaying(true)
  }

  const handleComplete = () => {
    setIsPlaying(false)
    setIsComplete(true)
  }

  const handleTimeUpdate = (timeMs: number) => {
    setFinalTime(timeMs)
  }

  const handleRestart = async () => {
    if (gameMode === 'random') {
      setIsLoading(true)
      setIsComplete(false)
      setIsPlaying(false)
      setFinalTime(0)
      await fetchPuzzle('random', selectedCategory)
    } else {
      router.refresh()
    }
  }

  const handleChangeMode = () => {
    setPuzzle(null)
    setShowModeSelection(true)
    setShowCategorySelection(false)
    setIsPlaying(false)
    setIsComplete(false)
    setFinalTime(0)
    setError(null)
    setSelectedCategory(null)
  }

  if (showCategorySelection) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <button
              onClick={() => {
                setShowCategorySelection(false)
                setShowModeSelection(true)
              }}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              ← Voltar
            </button>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Escolher Tema
            </h1>
            <div className="w-20" />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Modo Aleatório - Escolha um Tema
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Selecione uma categoria temática ou jogue com todas as palavras
              </p>
            </div>

            {isLoading && (
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
                <p className="text-zinc-600 dark:text-zinc-400">A gerar puzzle...</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => handleSelectCategory(null)}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-xl border-2 border-zinc-300 bg-white p-6 text-left transition-all hover:border-zinc-500 hover:shadow-lg disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-2xl transition-transform group-hover:scale-110 dark:bg-zinc-800">
                  🎲
                </div>
                <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Todas as Palavras
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Puzzle com palavras de todos os temas
                </p>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.slug)}
                  disabled={isLoading || category.word_count < 10}
                  className="group relative overflow-hidden rounded-xl border-2 border-zinc-200 bg-white p-6 text-left transition-all hover:border-zinc-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  style={{ borderColor: category.word_count >= 10 ? `${category.color}30` : undefined }}
                >
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {category.name}
                  </h3>
                  <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {category.description}
                  </p>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    {category.word_count} palavras
                  </span>
                  {category.word_count < 10 && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Mínimo 10 palavras necessário
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (showModeSelection) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              ← Voltar
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Palavras Cruzadas
            </h1>
            <div className="w-20" />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Escolha o Modo de Jogo
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Selecione como quer jogar palavras cruzadas
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <button
                onClick={() => handleSelectMode('daily')}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-yellow-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-yellow-600"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-100 text-4xl transition-transform group-hover:scale-110 dark:bg-yellow-900">
                  📅
                </div>
                <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Modo Diário
                </h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  O mesmo puzzle para todos os jogadores. Novo puzzle todos os dias à meia-noite.
                </p>
                <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                  <li>✓ Competição global</li>
                  <li>✓ Leaderboard partilhada</li>
                  <li>✓ 1 puzzle por dia</li>
                </ul>
                <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-yellow-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-yellow-800" />
              </button>

              <button
                onClick={() => handleSelectMode('random')}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-2xl border-2 border-zinc-200 bg-white p-8 text-left transition-all hover:border-blue-400 hover:shadow-lg disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-4xl transition-transform group-hover:scale-110 dark:bg-blue-900">
                  🎲
                </div>
                <h3 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Modo Aleatório
                </h3>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Puzzle novo gerado automaticamente a cada jogo. Treino ilimitado!
                </p>
                <ul className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                  <li>✓ Puzzles infinitos</li>
                  <li>✓ Prática sem pressão</li>
                  <li>✓ Sem limite de tempo</li>
                </ul>
                <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-blue-200 opacity-20 transition-transform group-hover:scale-150 dark:bg-blue-800" />
              </button>
            </div>

            {isLoading && (
              <div className="mt-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  {gameMode === 'daily' ? 'A carregar puzzle diário...' : 'A gerar puzzle aleatório...'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
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

  const modeLabel = gameMode === 'daily'
    ? '📅 Diário'
    : selectedCategoryMeta
    ? `${selectedCategoryMeta.icon} ${selectedCategoryMeta.name}`
    : '🎲 Aleatório'

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
        {!isPlaying && !isComplete && (
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Como Jogar</h2>
            <ul className="mb-6 space-y-2 text-zinc-700 dark:text-zinc-300">
              <li>• Clique numa célula para começar a escrever</li>
              <li>• Use as <strong>setas</strong> do teclado para navegar</li>
              <li>• Prima <strong>Tab</strong> para alternar entre horizontal/vertical</li>
              <li>• Prima <strong>Backspace</strong> para apagar</li>
              <li>• Clique nas pistas para saltar para essa palavra</li>
              <li>• O temporizador começa quando clicar em &quot;Iniciar Jogo&quot;</li>
            </ul>
            {gameMode === 'daily' && puzzle.isFromPreviousDay && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Este é o puzzle de um dia anterior. O puzzle de hoje será gerado à meia-noite.
                </p>
              </div>
            )}
            <button
              onClick={handleStartGame}
              className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Iniciar Jogo
            </button>
          </div>
        )}

        {isPlaying && !isComplete && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CrosswordGrid
              grid={puzzle.grid_data}
              clues={puzzle.clues}
              onComplete={handleComplete}
              onCellChange={() => {}}
            />
          </div>
        )}

        {isComplete && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 text-6xl">🎉</div>
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Parabéns!</h2>
            <p className="mb-2 text-lg text-zinc-700 dark:text-zinc-300">
              Completou o puzzle {gameMode === 'daily' ? 'diário' : selectedCategoryMeta ? `de ${selectedCategoryMeta.name}` : 'aleatório'} em
            </p>
            <div className="mb-8 font-mono text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatChronometer(finalTime)}
            </div>

            {gameMode === 'random' && (
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Modo aleatório não conta para a leaderboard global
              </p>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={handleRestart}
                className="rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
                  className="rounded-full border border-zinc-300 px-8 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  Ver Classificações
                </Link>
              )}
              <button
                onClick={handleChangeMode}
                className="rounded-full border border-zinc-300 px-8 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
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
