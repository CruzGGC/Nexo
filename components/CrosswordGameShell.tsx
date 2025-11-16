'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import CrosswordGrid from '@/components/CrosswordGrid'
import Timer from '@/components/Timer'
import { formatChronometer } from '@/lib/utils/time'
import type { Category } from '@/lib/types/games'
import { ModeSelection } from '@/components/crossword/ModeSelection'
import { CategorySelection } from '@/components/crossword/CategorySelection'
import { HowToPlay } from '@/components/crossword/HowToPlay'
import { useCrosswordGame } from '@/hooks/useCrosswordGame'

const LISBON_DATE_FORMATTER = new Intl.DateTimeFormat('pt-PT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Lisbon'
})

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
    showCategorySelection,
    showModeSelection,
  } = useCrosswordGame({ initialCategories })

  const fallbackDateLabel = useMemo(() => formatLisbonDate(puzzle?.publish_date), [puzzle?.publish_date])
  const servedDateLabel = useMemo(() => formatLisbonDate(puzzle?.servedForDate), [puzzle?.servedForDate])

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
