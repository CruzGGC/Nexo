'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import type { Category, CrosswordPuzzle, GameMode } from '@/lib/types/games'

interface UseCrosswordGameOptions {
  initialCategories: Category[]
}

export function useCrosswordGame({ initialCategories }: UseCrosswordGameOptions) {
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

  const selectedCategoryMeta = useMemo(
    () => categories.find(category => category.slug === selectedCategory) ?? null,
    [categories, selectedCategory]
  )

  const modeLabel = useMemo(() => {
    if (gameMode === 'daily') {
      return '📅 Diário'
    }
    return selectedCategoryMeta ? `${selectedCategoryMeta.icon} ${selectedCategoryMeta.name}` : '🎲 Aleatório'
  }, [gameMode, selectedCategoryMeta])

  const refreshCategories = useCallback(async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories', {
        method: 'GET',
        cache: 'no-store'
      })
      setCategories(data)
    } catch (err) {
      console.error('Erro ao atualizar categorias:', err)
    }
  }, [])

  useEffect(() => {
    if (!initialCategories.length) {
      void refreshCategories()
    }
  }, [initialCategories.length, refreshCategories])

  const fetchPuzzle = useCallback(
    async (mode: GameMode, category?: string | null) => {
      setIsLoading(true)
      setError(null)

      try {
        let endpoint = mode === 'daily' ? '/api/crossword/daily' : '/api/crossword/random'
        if (category) {
          endpoint += `?category=${category}`
        }

        const data = await apiFetch<CrosswordPuzzle>(endpoint, {
          cache: 'no-store'
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
    },
    []
  )

  const handleSelectMode = useCallback(
    async (mode: GameMode) => {
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
    },
    [categories.length, fetchPuzzle, refreshCategories]
  )

  const handleSelectCategory = useCallback(
    async (categorySlug: string | null) => {
      setSelectedCategory(categorySlug)
      await fetchPuzzle('random', categorySlug)
    },
    [fetchPuzzle]
  )

  const handleStartGame = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const handleComplete = useCallback(() => {
    setIsPlaying(false)
    setIsComplete(true)
  }, [])

  const handleTimeUpdate = useCallback((timeMs: number) => {
    setFinalTime(timeMs)
  }, [])

  const handleRestart = useCallback(async () => {
    if (gameMode === 'random') {
      setIsLoading(true)
      setIsComplete(false)
      setIsPlaying(false)
      setFinalTime(0)
      await fetchPuzzle('random', selectedCategory)
    } else {
      router.refresh()
    }
  }, [fetchPuzzle, gameMode, router, selectedCategory])

  const handleChangeMode = useCallback(() => {
    setPuzzle(null)
    setShowModeSelection(true)
    setShowCategorySelection(false)
    setIsPlaying(false)
    setIsComplete(false)
    setFinalTime(0)
    setError(null)
    setSelectedCategory(null)
  }, [])

  const handleBackToModeSelection = useCallback(() => {
    setShowCategorySelection(false)
    setShowModeSelection(true)
  }, [])

  return {
    categories,
    error,
    fetchPuzzle,
    finalTime,
    gameMode,
    handleChangeMode,
    handleBackToModeSelection,
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
    refreshCategories,
    selectedCategory,
    selectedCategoryMeta,
    showCategorySelection,
    showModeSelection
  }
}
