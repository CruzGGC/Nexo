/**
 * Supabase Edge Function: Generate Daily Crossword
 * 
 * This function runs automatically at midnight (Portugal timezone) via pg_cron.
 * It generates a new crossword puzzle from random Portuguese words and stores it
 * in the puzzles table.
 * 
 * Triggered by: Cron job (see migration 003_schedule_daily_crossword.sql)
 * Endpoint: POST https://your-project.supabase.co/functions/v1/generate-daily-crossword
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inline CrosswordGenerator (simplified for Deno)
interface WordEntry {
  word: string
  definition: string
}

interface PlacedWord {
  word: string
  definition: string
  row: number
  col: number
  direction: 'across' | 'down'
  number?: number
}

interface GridCell {
  letter: string
  isBlack: boolean
  number?: number
}

class CrosswordGenerator {
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

  generate(words: WordEntry[], maxWords: number = 10) {
    const filteredWords = words
      .filter((w) => w.word.length >= 3 && w.word.length <= 10)
      .slice(0, maxWords * 3)

    if (filteredWords.length === 0) return null

    const shuffled = this.shuffleArray(filteredWords)
    const firstWord = shuffled[0]
    const startRow = Math.floor(this.gridSize / 2)
    const startCol = Math.floor((this.gridSize - firstWord.word.length) / 2)

    if (!this.placeWord(firstWord, startRow, startCol, 'across')) return null

    let wordsPlaced = 1
    for (let i = 1; i < shuffled.length && wordsPlaced < maxWords; i++) {
      if (this.tryPlaceWord(shuffled[i])) wordsPlaced++
    }

    if (wordsPlaced < 5) return null

    this.trimGrid()
    this.assignNumbers()
    return this.buildPuzzle()
  }

  private placeWord(
    word: WordEntry,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): boolean {
    const wordUpper = word.word.toUpperCase()

    if (direction === 'across') {
      if (col + wordUpper.length > this.gridSize) return false
    } else {
      if (row + wordUpper.length > this.gridSize) return false
    }

    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i
      const c = direction === 'across' ? col + i : col
      if (this.grid[r][c].letter && this.grid[r][c].letter !== wordUpper[i]) {
        return false
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
    })

    return true
  }

  private tryPlaceWord(word: WordEntry): boolean {
    const wordUpper = word.word.toUpperCase()

    for (const placed of this.placedWords) {
      for (const direction of ['across', 'down'] as const) {
        if (direction === placed.direction) continue

        for (let i = 0; i < wordUpper.length; i++) {
          for (let j = 0; j < placed.word.length; j++) {
            if (wordUpper[i] === placed.word[j]) {
              let newRow: number, newCol: number

              if (direction === 'across') {
                newRow = placed.direction === 'across' ? placed.row : placed.row + j
                newCol = placed.direction === 'across' ? placed.col + j - i : placed.col
              } else {
                newRow = placed.direction === 'across' ? placed.row : placed.row + j - i
                newCol = placed.direction === 'across' ? placed.col + j : placed.col
              }

              if (
                newRow >= 0 &&
                newCol >= 0 &&
                newRow < this.gridSize &&
                newCol < this.gridSize &&
                this.placeWord(word, newRow, newCol, direction)
              ) {
                return true
              }
            }
          }
        }
      }
    }
    return false
  }

  private trimGrid(): GridCell[][] {
    let minRow = this.gridSize,
      maxRow = 0,
      minCol = this.gridSize,
      maxCol = 0

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
        row.push({ letter: cell.letter, isBlack: !cell.letter, number: cell.number })
      }
      trimmed.push(row)
    }

    this.placedWords = this.placedWords.map((word) => ({
      ...word,
      row: word.row - minRow,
      col: word.col - minCol,
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
      const key = `${word.row},${word.col}`
      if (!numbered.has(key)) {
        word.number = number
        this.grid[word.row][word.col].number = number
        numbered.add(key)
        number++
      }
    }
  }

  private buildPuzzle() {
    const grid = this.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => ({
        value: '',
        correct: cell.letter,
        number: cell.number,
        isBlack: cell.isBlack,
        row: rowIndex,
        col: colIndex,
      }))
    )

    const across: any[] = []
    const down: any[] = []

    for (const word of this.placedWords) {
      if (!word.number) continue

      const clue = {
        number: word.number,
        text: word.definition,
        answer: word.word,
        startRow: word.row,
        startCol: word.col,
        direction: word.direction,
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

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🎯 Generating daily crossword...')

    // Get random words from dictionary (50 words to have options)
    const { data: words, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .not('definition', 'is', null)
      .gte('word', 'a')
      .lte('word', 'z')
      .limit(100)

    if (wordsError) {
      throw new Error(`Failed to fetch words: ${wordsError.message}`)
    }

    if (!words || words.length === 0) {
      throw new Error('No words found in dictionary')
    }

    console.log(`📚 Found ${words.length} words`)

    // Generate crossword (try up to 5 times for a good puzzle)
    let puzzle = null
    let attempts = 0
    const maxAttempts = 5

    while (!puzzle && attempts < maxAttempts) {
      attempts++
      console.log(`🔄 Attempt ${attempts}/${maxAttempts}`)
      
      const generator = new CrosswordGenerator(15)
      puzzle = generator.generate(words, 12)
    }

    if (!puzzle) {
      throw new Error('Failed to generate puzzle after multiple attempts')
    }

    console.log('✅ Puzzle generated successfully')

    // Get today's date in Portugal timezone
    const today = new Date()
    const portugalDate = new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Europe/Lisbon',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today)

    const [day, month, year] = portugalDate.split('/')
    const publishDate = `${year}-${month}-${day}`

    console.log(`📅 Publishing for date: ${publishDate}`)

    // Check if puzzle for today already exists
    const { data: existingPuzzle } = await supabase
      .from('puzzles')
      .select('id')
      .eq('type', 'daily')
      .eq('publish_date', publishDate)
      .single()

    if (existingPuzzle) {
      console.log('⚠️  Puzzle for today already exists, skipping')
      return new Response(
        JSON.stringify({ 
          message: 'Puzzle already exists for today',
          date: publishDate 
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Insert puzzle into database
    const { data: insertedPuzzle, error: insertError } = await supabase
      .from('puzzles')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        clues: puzzle.clues,
        solutions: {}, // Not used, answers are in grid_data
        publish_date: publishDate,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert puzzle: ${insertError.message}`)
    }

    console.log('🎉 Daily crossword generated and saved!')

    return new Response(
      JSON.stringify({
        success: true,
        puzzle_id: insertedPuzzle.id,
        date: publishDate,
        words_count: puzzle.clues.across.length + puzzle.clues.down.length,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('❌ Error generating daily crossword:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
