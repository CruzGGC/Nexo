/**
 * Crossword Generator - Generates Portuguese crossword puzzles automatically
 *
 * Algorithm:
 * 1. Select random words from dictionary (filtered by length constraints)
 * 2. Place first word horizontally in center
 * 3. For each subsequent word, try to find intersection with existing words
 * 4. Build grid with black cells and numbered cells
 * 5. Generate clues from word definitions
 */

import type { CrosswordCell, CrosswordClue } from '@/lib/types/crossword'
import { normalizeForComparison } from '@/lib/utils/text'

type Cell = CrosswordCell
type Clue = CrosswordClue

export interface WordEntry {
  word: string
  definition: string
}

interface PreparedWord extends WordEntry {
  display: string
  normalized: string
}

interface PlacedWord {
  word: string
  definition: string
  row: number
  col: number
  direction: 'across' | 'down'
  number?: number
  normalized: string
}

interface GridCell {
  letter: string
  isBlack: boolean
  number?: number
}

export class CrosswordGenerator {
  private grid: GridCell[][]
  private placedWords: PlacedWord[] = []
  private gridSize: number

  constructor(gridSize: number = 15) {
    this.gridSize = gridSize
    this.grid = this.initializeGrid()
  }

  private initializeGrid(): GridCell[][] {
    return Array(this.gridSize)
      .fill(null)
      .map(() =>
        Array(this.gridSize)
          .fill(null)
          .map(() => ({ letter: '', isBlack: false }))
      )
  }

  /**
   * Generate a crossword puzzle from a list of words
   * Now includes quality metrics and intersection scoring
   */
  generate(words: WordEntry[], maxWords: number = 10): {
    grid: Cell[][]
    clues: { across: Clue[]; down: Clue[] }
    quality: { intersections: number; density: number; score: number }
  } | null {
    const filteredWords: PreparedWord[] = words
      .filter(w => w.word.length >= 3 && w.word.length <= 10)
      .map(word => ({
        ...word,
        display: word.word.toUpperCase(),
        normalized: normalizeForComparison(word.word)
      }))
      .slice(0, maxWords * 3)

    if (filteredWords.length === 0) {
      return null
    }

    const shuffled = this.shuffleArray(filteredWords)

    const firstWord = shuffled[0]
    const startRow = Math.floor(this.gridSize / 2)
    const startCol = Math.floor((this.gridSize - firstWord.display.length) / 2)

    if (!this.placeWord(firstWord, startRow, startCol, 'across')) {
      return null
    }

    let wordsPlaced = 1
    let totalIntersections = 0

    for (let i = 1; i < shuffled.length && wordsPlaced < maxWords; i++) {
      const intersections = this.tryPlaceWordWithScore(shuffled[i])
      if (intersections > 0) {
        wordsPlaced++
        totalIntersections += intersections
      }
    }

    if (wordsPlaced < 6) {
      return null
    }

    const avgIntersections = totalIntersections / wordsPlaced
    const minIntersections = 0.6

    if (avgIntersections < minIntersections) {
      console.log(`❌ Puzzle rejeitado: interseções médias ${avgIntersections.toFixed(2)} < ${minIntersections}`)
      return null
    }

    this.trimGrid()
    this.assignNumbers()

    const filledCells = this.placedWords.reduce((sum, word) => sum + word.word.length, 0)
    const totalCells = this.grid.length * this.grid[0].length
    const density = filledCells / totalCells
    const minDensity = 0.35

    if (density < minDensity) {
      console.log(`❌ Puzzle rejeitado: densidade ${density.toFixed(2)} < ${minDensity}`)
      return null
    }

    const qualityScore = Math.min(
      100,
      Math.round(wordsPlaced * 10 + avgIntersections * 50 + density * 30)
    )

    if (qualityScore < 60) {
      console.log(`❌ Puzzle rejeitado: qualidade ${qualityScore}`)
      return null
    }

    const puzzle = this.buildPuzzle()

    return {
      ...puzzle,
      quality: {
        intersections: totalIntersections,
        density: Math.round(density * 100) / 100,
        score: qualityScore
      }
    }
  }

  private placeWord(word: PreparedWord, row: number, col: number, direction: 'across' | 'down'): boolean {
    const wordUpper = word.display

    if (direction === 'across') {
      if (col + wordUpper.length > this.gridSize) return false
    } else {
      if (row + wordUpper.length > this.gridSize) return false
    }

    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i
      const c = direction === 'across' ? col + i : col

      if (this.grid[r][c].letter) {
        const existing = normalizeForComparison(this.grid[r][c].letter)
        if (existing !== word.normalized[i]) {
        return false
        }
      }
    }

    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i
      const c = direction === 'across' ? col + i : col
      this.grid[r][c].letter = wordUpper[i]
    }

    this.placedWords.push({
      word: wordUpper,
      definition: word.definition,
      row,
      col,
      direction,
      normalized: word.normalized
    })

    return true
  }

  private tryPlaceWordWithScore(word: PreparedWord): number {
    const wordUpper = word.display
    let bestIntersections = 0
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down' } | null = null

    for (const placed of this.placedWords) {
      for (const direction of ['across', 'down'] as const) {
        if (direction === placed.direction) continue

        for (let i = 0; i < wordUpper.length; i++) {
          for (let j = 0; j < placed.word.length; j++) {
            if (word.normalized[i] === placed.normalized[j]) {
              let newRow: number
              let newCol: number

              if (direction === 'across') {
                newRow = placed.direction === 'across' ? placed.row : placed.row + j
                newCol = placed.direction === 'across' ? placed.col + j - i : placed.col
              } else {
                newRow = placed.direction === 'across' ? placed.row : placed.row + j - i
                newCol = placed.direction === 'across' ? placed.col + j : placed.col
              }

              if (newRow >= 0 && newCol >= 0 && newRow < this.gridSize && newCol < this.gridSize) {
                const intersections = this.countIntersections(word, newRow, newCol, direction)
                if (intersections > bestIntersections) {
                  bestIntersections = intersections
                  bestPlacement = { row: newRow, col: newCol, direction }
                }
              }
            }
          }
        }
      }
    }

    if (bestPlacement && this.placeWord(word, bestPlacement.row, bestPlacement.col, bestPlacement.direction)) {
      return bestIntersections
    }

    return 0
  }

  private countIntersections(
    word: PreparedWord,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): number {
    const wordUpper = word.display
    let intersections = 0

    if (direction === 'across') {
      if (col + wordUpper.length > this.gridSize) return 0
    } else {
      if (row + wordUpper.length > this.gridSize) return 0
    }

    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i
      const c = direction === 'across' ? col + i : col

      if (this.grid[r][c].letter) {
        const existing = normalizeForComparison(this.grid[r][c].letter)
        if (existing === word.normalized[i]) {
          intersections++
        } else {
          return 0
        }
      }
    }

    return intersections
  }

  private trimGrid(): GridCell[][] {
    let minRow = this.gridSize
    let maxRow = 0
    let minCol = this.gridSize
    let maxCol = 0

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c].letter) {
          minRow = Math.min(minRow, r)
          maxRow = Math.max(maxRow, r)
          minCol = Math.min(minCol, c)
          maxCol = Math.max(maxCol, c)
        }
      }
    }

    minRow = Math.max(0, minRow - 1)
    maxRow = Math.min(this.gridSize - 1, maxRow + 1)
    minCol = Math.max(0, minCol - 1)
    maxCol = Math.min(this.gridSize - 1, maxCol + 1)

    const trimmed: GridCell[][] = []
    for (let r = minRow; r <= maxRow; r++) {
      const row: GridCell[] = []
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.grid[r][c]
        row.push({
          letter: cell.letter,
          isBlack: !cell.letter,
          number: cell.number
        })
      }
      trimmed.push(row)
    }

    this.placedWords = this.placedWords.map(word => ({
      ...word,
      row: word.row - minRow,
      col: word.col - minCol
    }))

    this.grid = trimmed
    this.gridSize = trimmed.length

    return trimmed
  }

  private assignNumbers(): void {
    let number = 1
    const numbered = new Set<string>()

    const sorted = [...this.placedWords].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row
      return a.col - b.col
    })

    for (const word of sorted) {
      const key = `${word.row},${word.col},${word.direction}`
      if (!numbered.has(key)) {
        const existingNumber = this.grid[word.row][word.col].number

        if (existingNumber) {
          word.number = existingNumber
        } else {
          word.number = number
          this.grid[word.row][word.col].number = number
          number++
        }

        numbered.add(key)
      }
    }
  }

  private buildPuzzle(): { grid: Cell[][]; clues: { across: Clue[]; down: Clue[] } } {
    const validCells = new Set<string>()
    for (const word of this.placedWords) {
      for (let i = 0; i < word.word.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i
        const c = word.direction === 'across' ? word.col + i : word.col
        validCells.add(`${r},${c}`)
      }
    }

    const grid: Cell[][] = this.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const key = `${rowIndex},${colIndex}`
        const isValid = validCells.has(key)

        return {
          value: '',
          correct: isValid ? cell.letter : '',
          number: cell.number,
          isBlack: !isValid || cell.isBlack,
          row: rowIndex,
          col: colIndex
        }
      })
    )

    const across: Clue[] = []
    const down: Clue[] = []

    for (const word of this.placedWords) {
      if (!word.number) continue

      const clue: Clue = {
        number: word.number,
        text: word.definition,
        answer: word.word,
        startRow: word.row,
        startCol: word.col,
        direction: word.direction
      }

      if (word.direction === 'across') {
        across.push(clue)
      } else {
        down.push(clue)
      }
    }

    across.sort((a, b) => a.number - b.number)
    down.sort((a, b) => a.number - b.number)

    return { grid, clues: { across, down } }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
