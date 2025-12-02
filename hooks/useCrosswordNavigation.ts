'use client'

/**
 * useCrosswordNavigation Hook
 * 
 * Handles keyboard navigation logic for crossword puzzles.
 * Extracted from CrosswordGrid.tsx for reusability.
 */

import { useCallback } from 'react'
import type { CrosswordCell } from '@/lib/types/crossword'
import { isCellPlayable } from '@/lib/crossword/grid-utils'

type Cell = CrosswordCell

interface NavigationState {
  selectedCell: { row: number; col: number } | null
  direction: 'across' | 'down'
}

interface NavigationActions {
  setSelectedCell: (cell: { row: number; col: number } | null) => void
  setDirection: (direction: 'across' | 'down') => void
}

interface UseCrosswordNavigationReturn {
  /** Move to next/previous cell in current direction */
  moveToNextCell: (row: number, col: number, backwards: boolean) => void
  /** Move horizontally with direction change */
  moveHorizontal: (row: number, col: number, delta: number) => void
  /** Move vertically with direction change */
  moveVertical: (row: number, col: number, delta: number) => void
  /** Handle cell click (select or toggle direction) */
  handleCellClick: (row: number, col: number) => void
  /** Check if a key is a valid letter input */
  isValidLetterKey: (key: string) => boolean
}

// Portuguese diacritics pattern
const LETTER_PATTERN = /^[a-záàâãéêíóôõúçA-ZÁÀÂÃÉÊÍÓÔÕÚÇ]$/

/**
 * Hook for crossword grid navigation
 */
export function useCrosswordNavigation(
  grid: Cell[][],
  state: NavigationState,
  actions: NavigationActions
): UseCrosswordNavigationReturn {
  const { selectedCell, direction } = state
  const { setSelectedCell, setDirection } = actions

  /**
   * Move to next/previous playable cell in current direction
   */
  const moveToNextCell = useCallback((row: number, col: number, backwards: boolean) => {
    const delta = backwards ? -1 : 1

    if (direction === 'across') {
      let newCol = col + delta
      while (newCol >= 0 && newCol < grid[row].length) {
        if (isCellPlayable(grid[row][newCol])) {
          setSelectedCell({ row, col: newCol })
          return
        }
        newCol += delta
      }
    } else {
      let newRow = row + delta
      while (newRow >= 0 && newRow < grid.length) {
        if (isCellPlayable(grid[newRow][col])) {
          setSelectedCell({ row: newRow, col })
          return
        }
        newRow += delta
      }
    }
  }, [direction, grid, setSelectedCell])

  /**
   * Move horizontally and set direction to across
   */
  const moveHorizontal = useCallback((row: number, col: number, delta: number) => {
    let newCol = col + delta
    while (newCol >= 0 && newCol < grid[row].length) {
      if (isCellPlayable(grid[row][newCol])) {
        setSelectedCell({ row, col: newCol })
        setDirection('across')
        return
      }
      newCol += delta
    }
  }, [grid, setDirection, setSelectedCell])

  /**
   * Move vertically and set direction to down
   */
  const moveVertical = useCallback((row: number, col: number, delta: number) => {
    let newRow = row + delta
    while (newRow >= 0 && newRow < grid.length) {
      if (isCellPlayable(grid[newRow][col])) {
        setSelectedCell({ row: newRow, col })
        setDirection('down')
        return
      }
      newRow += delta
    }
  }, [grid, setDirection, setSelectedCell])

  /**
   * Handle cell click - select or toggle direction if same cell
   */
  const handleCellClick = useCallback((row: number, col: number) => {
    const cell = grid[row][col]
    if (!isCellPlayable(cell)) return

    // If clicking the same cell, toggle direction
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection(direction === 'across' ? 'down' : 'across')
    } else {
      setSelectedCell({ row, col })
    }
  }, [direction, grid, selectedCell, setDirection, setSelectedCell])

  /**
   * Check if a key is a valid Portuguese letter
   */
  const isValidLetterKey = useCallback((key: string): boolean => {
    return key.length === 1 && LETTER_PATTERN.test(key)
  }, [])

  return {
    moveToNextCell,
    moveHorizontal,
    moveVertical,
    handleCellClick,
    isValidLetterKey
  }
}

/**
 * Create a keyboard event handler for crossword navigation
 */
export function createKeyboardHandler(
  selectedCell: { row: number; col: number } | null,
  navigation: UseCrosswordNavigationReturn,
  callbacks: {
    onBackspace: () => void
    onTab: () => void
    onLetterInput: (letter: string) => void
  }
) {
  return (e: React.KeyboardEvent) => {
    if (!selectedCell) return

    const { row, col } = selectedCell

    switch (e.key) {
      case 'Backspace':
        e.preventDefault()
        callbacks.onBackspace()
        break

      case 'Tab':
        e.preventDefault()
        callbacks.onTab()
        break

      case 'ArrowUp':
        e.preventDefault()
        navigation.moveVertical(row, col, -1)
        break

      case 'ArrowDown':
        e.preventDefault()
        navigation.moveVertical(row, col, 1)
        break

      case 'ArrowLeft':
        e.preventDefault()
        navigation.moveHorizontal(row, col, -1)
        break

      case 'ArrowRight':
        e.preventDefault()
        navigation.moveHorizontal(row, col, 1)
        break

      default:
        if (navigation.isValidLetterKey(e.key)) {
          e.preventDefault()
          callbacks.onLetterInput(e.key.toUpperCase())
        }
    }
  }
}
