// Supabase Edge Function: Generate Daily Crossword
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  value: string
  correct: string
  number?: number
  isBlack: boolean
  row: number
  col: number
}

interface GeneratedPuzzle {
  grid: GridCell[][]
  clues: {
    across: Array<{
      number: number
      text: string
      answer: string
      startRow: number
      startCol: number
      direction: 'across'
    }>
    down: Array<{
      number: number
      text: string
      answer: string
      startRow: number
      startCol: number
      direction: 'down'
    }>
  }
  quality: {
    intersections: number
    density: number
    score: number
  }
}

class CrosswordGenerator {
  private grid: Array<Array<{ letter: string; number?: number }>>
  private placedWords: PlacedWord[] = []
  private readonly size: number

  constructor(size: number = 15) {
    this.size = size
    this.grid = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ letter: '' }))
    )
  }

  generate(words: WordEntry[], maxWords: number = 12): GeneratedPuzzle | null {
    const filtered = words
      .filter(w => w.word.length >= 3 && w.word.length <= 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, maxWords * 2)

    if (filtered.length < 5) return null

    const firstWord = filtered[0]
    const startRow = Math.floor(this.size / 2)
    const startCol = Math.floor((this.size - firstWord.word.length) / 2)
    
    if (!this.placeWord(firstWord, startRow, startCol, 'across')) return null

    let totalIntersections = 0
    for (let i = 1; i < filtered.length && this.placedWords.length < maxWords; i++) {
      const intersections = this.tryPlaceWithIntersection(filtered[i])
      if (intersections > 0) totalIntersections += intersections
    }

    if (this.placedWords.length < 5) return null

    const avgIntersections = totalIntersections / this.placedWords.length
    if (avgIntersections < 0.3) return null

    this.trimGrid()
    this.assignNumbers()
    
    return this.buildPuzzle()
  }

  private placeWord(word: WordEntry, row: number, col: number, dir: 'across' | 'down'): boolean {
    const w = word.word.toUpperCase()
    
    if (dir === 'across' && col + w.length > this.size) return false
    if (dir === 'down' && row + w.length > this.size) return false

    for (let i = 0; i < w.length; i++) {
      const r = dir === 'across' ? row : row + i
      const c = dir === 'across' ? col + i : col
      const existing = this.grid[r][c].letter
      if (existing && existing !== w[i]) return false
    }

    for (let i = 0; i < w.length; i++) {
      const r = dir === 'across' ? row : row + i
      const c = dir === 'across' ? col + i : col
      this.grid[r][c].letter = w[i]
    }

    this.placedWords.push({
      word: w,
      definition: word.definition,
      row,
      col,
      direction: dir
    })

    return true
  }

  private tryPlaceWithIntersection(word: WordEntry): number {
    const w = word.word.toUpperCase()
    
    for (const placed of this.placedWords) {
      const oppDir = placed.direction === 'across' ? 'down' : 'across'
      
      for (let i = 0; i < w.length; i++) {
        for (let j = 0; j < placed.word.length; j++) {
          if (w[i] === placed.word[j]) {
            const newRow = oppDir === 'across' 
              ? (placed.direction === 'across' ? placed.row : placed.row + j)
              : (placed.direction === 'across' ? placed.row : placed.row + j - i)
            const newCol = oppDir === 'across'
              ? (placed.direction === 'across' ? placed.col + j - i : placed.col)
              : (placed.direction === 'across' ? placed.col + j : placed.col)

            if (this.placeWord(word, newRow, newCol, oppDir)) {
              return 1
            }
          }
        }
      }
    }
    return 0
  }

  private trimGrid(): void {
    let minRow = this.size, maxRow = 0, minCol = this.size, maxCol = 0

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c].letter) {
          minRow = Math.min(minRow, r)
          maxRow = Math.max(maxRow, r)
          minCol = Math.min(minCol, c)
          maxCol = Math.max(maxCol, c)
        }
      }
    }

    minRow = Math.max(0, minRow - 1)
    maxRow = Math.min(this.size - 1, maxRow + 1)
    minCol = Math.max(0, minCol - 1)
    maxCol = Math.min(this.size - 1, maxCol + 1)

    const trimmed = []
    for (let r = minRow; r <= maxRow; r++) {
      const row = []
      for (let c = minCol; c <= maxCol; c++) {
        row.push({ ...this.grid[r][c] })
      }
      trimmed.push(row)
    }

    this.placedWords = this.placedWords.map(w => ({
      ...w,
      row: w.row - minRow,
      col: w.col - minCol
    }))

    this.grid = trimmed
  }

  private assignNumbers(): void {
    let num = 1
    const sorted = [...this.placedWords].sort((a, b) => 
      a.row !== b.row ? a.row - b.row : a.col - b.col
    )

    for (const word of sorted) {
      const existing = this.grid[word.row][word.col].number
      if (existing) {
        word.number = existing
      } else {
        word.number = num
        this.grid[word.row][word.col].number = num
        num++
      }
    }
  }

  private buildPuzzle(): GeneratedPuzzle {
    const validCells = new Set<string>()
    for (const word of this.placedWords) {
      for (let i = 0; i < word.word.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i
        const c = word.direction === 'across' ? word.col + i : word.col
        validCells.add(`${r},${c}`)
      }
    }

    const grid = this.grid.map((row, r) =>
      row.map((cell, c) => {
        const key = `${r},${c}`
        const isValid = validCells.has(key)
        return {
          value: '',
          correct: isValid ? cell.letter : '',
          number: cell.number,
          isBlack: !isValid,
          row: r,
          col: c
        }
      })
    )

    const across = this.placedWords
      .filter(w => w.direction === 'across')
      .map(w => ({
        number: w.number!,
        text: w.definition,
        answer: w.word,
        startRow: w.row,
        startCol: w.col,
        direction: 'across' as const
      }))
      .sort((a, b) => a.number - b.number)

    const down = this.placedWords
      .filter(w => w.direction === 'down')
      .map(w => ({
        number: w.number!,
        text: w.definition,
        answer: w.word,
        startRow: w.row,
        startCol: w.col,
        direction: 'down' as const
      }))
      .sort((a, b) => a.number - b.number)

    const filledCells = this.placedWords.reduce((sum, w) => sum + w.word.length, 0)
    const totalCells = grid.length * grid[0].length
    const density = filledCells / totalCells
    const intersections = this.placedWords.length - 1

    return {
      grid,
      clues: { across, down },
      quality: {
        intersections,
        density: Math.round(density * 100) / 100,
        score: Math.min(100, Math.round(
          this.placedWords.length * 8 + intersections * 4 + density * 20
        ))
      }
    }
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  console.log(`[${requestId}] Starting daily crossword generation`)
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: words, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .not('definition', 'is', null)
      .gte('word', 'aaa')
      .limit(150)

    if (wordsError) throw new Error(`Failed to fetch words: ${wordsError.message}`)
    if (!words || words.length < 20) throw new Error('Insufficient words in dictionary')

    console.log(`[${requestId}] Fetched ${words.length} words`)

    let puzzle: GeneratedPuzzle | null = null
    let attempts = 0
    const maxAttempts = 5

    while (!puzzle && attempts < maxAttempts) {
      attempts++
      const generator = new CrosswordGenerator(15)
      puzzle = generator.generate(words, 12)
      
      if (puzzle && puzzle.quality.score >= 50) {
        console.log(`[${requestId}] Generated puzzle: ${puzzle.clues.across.length + puzzle.clues.down.length} words, quality ${puzzle.quality.score}`)
        break
      }
      puzzle = null
    }

    if (!puzzle) throw new Error('Failed to generate quality puzzle after 5 attempts')

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })
    
    const { data: existing } = await supabase
      .from('crosswords')
      .select('id')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .maybeSingle()

    if (existing) {
      console.log(`[${requestId}] Puzzle already exists for ${today}`)
      return new Response(
        JSON.stringify({ 
          message: 'Crossword already exists for today',
          puzzle_id: existing.id,
          date: today
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { data: inserted, error: insertError } = await supabase
      .from('crosswords')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        clues: puzzle.clues,
        solutions: {},
        quality_score: puzzle.quality.score,
        publish_date: today
      })
      .select('id')
      .single()

    if (insertError) throw new Error(`Failed to insert: ${insertError.message}`)

    const totalTime = Date.now() - startTime
    const wordCount = puzzle.clues.across.length + puzzle.clues.down.length

    console.log(`[${requestId}] SUCCESS in ${totalTime}ms: ${wordCount} words, quality ${puzzle.quality.score}`)

    return new Response(
      JSON.stringify({
        success: true,
        puzzle_id: inserted.id,
        date: today,
        words_count: wordCount,
        quality_score: puzzle.quality.score,
        total_time_ms: totalTime,
        attempts
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    const error = err as Error
    const totalTime = Date.now() - startTime
    
    console.error(`[${requestId}] ERROR after ${totalTime}ms:`, error.message)
    console.error(`[${requestId}] Stack:`, error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        request_id: requestId,
        elapsed_ms: totalTime
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
