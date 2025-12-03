/**
 * Crossword Grid Utilities
 * 
 * Pure functions for crossword grid operations.
 * Extracted from CrosswordGrid.tsx for reusability and testability.
 */

import type { CrosswordCell, CrosswordClue } from '@/lib/types/crossword'
import { equalsNormalized } from '@/lib/utils/text'

export type Cell = CrosswordCell
export type Clue = CrosswordClue

export interface GridAnalysis {
  /** Number of cells with user input */
  filled: number
  /** Total playable cells (non-black with correct answer) */
  total: number
  /** Number of correctly filled cells */
  correct: number
  /** Number of cells with errors */
  errors: number
  /** Whether the puzzle is complete (all correct) */
  isComplete: boolean
}

/**
 * Check if a cell is playable (not black and has a correct answer)
 */
export function isCellPlayable(cell: Cell): boolean {
  return !cell.isBlack && Boolean(cell.correct?.trim())
}

/**
 * Get cell counts for progress tracking
 */
export function getCellCounts(grid: Cell[][]): { filled: number; total: number } {
  let filled = 0
  let total = 0
  
  for (const row of grid) {
    for (const cell of row) {
      if (!isCellPlayable(cell)) continue
      total++
      if (cell.value?.trim()) filled++
    }
  }
  
  return { filled, total }
}

/**
 * Check if a cell value matches the correct answer
 */
export function isCellCorrect(cell: Cell): boolean {
  if (!isCellPlayable(cell)) return false
  const cellValue = cell.value?.trim() ?? ''
  const correctValue = cell.correct?.trim() ?? ''
  return Boolean(cellValue) && equalsNormalized(cellValue, correctValue)
}

/**
 * Check if a cell has an error (filled but incorrect)
 */
export function isCellError(cell: Cell): boolean {
  if (!isCellPlayable(cell)) return false
  const cellValue = cell.value?.trim() ?? ''
  const correctValue = cell.correct?.trim() ?? ''
  return Boolean(cellValue) && !equalsNormalized(cellValue, correctValue)
}

/**
 * Count errors in the grid
 */
export function countErrors(grid: Cell[][]): number {
  let errors = 0
  for (const row of grid) {
    for (const cell of row) {
      if (isCellError(cell)) errors++
    }
  }
  return errors
}

/**
 * Check if the puzzle is complete (all cells correct)
 */
export function checkIsComplete(grid: Cell[][]): boolean {
  let total = 0
  let correct = 0
  
  for (const row of grid) {
    for (const cell of row) {
      if (!isCellPlayable(cell)) continue
      total++
      if (isCellCorrect(cell)) correct++
    }
  }
  
  return total > 0 && correct === total
}

/**
 * Comprehensive grid analysis in a single pass
 */
export function analyzeGrid(grid: Cell[][]): GridAnalysis {
  let filled = 0
  let total = 0
  let correct = 0
  let errors = 0
  
  for (const row of grid) {
    for (const cell of row) {
      if (!isCellPlayable(cell)) continue
      
      total++
      const cellValue = cell.value?.trim() ?? ''
      const correctValue = cell.correct?.trim() ?? ''
      
      if (cellValue) {
        filled++
        if (equalsNormalized(cellValue, correctValue)) {
          correct++
        } else {
          errors++
        }
      }
    }
  }
  
  return {
    filled,
    total,
    correct,
    errors,
    isComplete: total > 0 && correct === total
  }
}

/**
 * Find the clue that contains a specific cell
 */
export function findClueForCell(
  row: number,
  col: number,
  direction: 'across' | 'down',
  clues: { across: Clue[]; down: Clue[] }
): Clue | null {
  const clueList = direction === 'across' ? clues.across : clues.down
  
  for (const clue of clueList) {
    if (direction === 'across') {
      if (
        row === clue.startRow &&
        col >= clue.startCol &&
        col < clue.startCol + clue.answer.length
      ) {
        return clue
      }
    } else {
      if (
        col === clue.startCol &&
        row >= clue.startRow &&
        row < clue.startRow + clue.answer.length
      ) {
        return clue
      }
    }
  }
  
  return null
}

/**
 * Check if a cell is part of the currently selected word
 */
export function isCellInWord(
  row: number,
  col: number,
  clue: Clue | null,
  direction: 'across' | 'down'
): boolean {
  if (!clue) return false
  
  if (direction === 'across') {
    return (
      row === clue.startRow &&
      col >= clue.startCol &&
      col < clue.startCol + clue.answer.length
    )
  } else {
    return (
      col === clue.startCol &&
      row >= clue.startRow &&
      row < clue.startRow + clue.answer.length
    )
  }
}

/**
 * Create a deep copy of the grid for immutable updates
 */
export function copyGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })))
}

/**
 * Update a single cell in the grid (immutable)
 */
export function updateCell(
  grid: Cell[][],
  row: number,
  col: number,
  value: string
): Cell[][] {
  const newGrid = copyGrid(grid)
  newGrid[row][col] = { ...newGrid[row][col], value }
  return newGrid
}

/**
 * Clear a cell value (immutable)
 */
export function clearCell(grid: Cell[][], row: number, col: number): Cell[][] {
  return updateCell(grid, row, col, '')
}

/**
 * Get grid dimensions
 */
export function getGridDimensions(grid: Cell[][]): { rows: number; cols: number } {
  return {
    rows: grid.length,
    cols: grid[0]?.length ?? 0
  }
}
