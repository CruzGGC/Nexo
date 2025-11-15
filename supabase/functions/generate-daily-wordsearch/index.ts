// Supabase Edge Function: Generate Daily Word Search
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WordEntry {
  word: string
  definition: string
}

interface PlacedWord {
  word: string
  row: number
  col: number
  direction: string
}

interface GridCell {
  letter: string
  row: number
  col: number
}

interface GeneratedPuzzle {
  grid: GridCell[][]
  words: Array<{
    word: string
    definition: string
    row: number
    col: number
    direction: string
  }>
  size: number
}

class WordSearchGenerator {
  private grid: string[][]
  private readonly size: number
  private placedWords: PlacedWord[] = []
  private readonly directions = [
    { dx: 1, dy: 0, name: 'horizontal' },
    { dx: 0, dy: 1, name: 'vertical' },
    { dx: 1, dy: 1, name: 'diagonal-down' },
    { dx: 1, dy: -1, name: 'diagonal-up' },
    { dx: -1, dy: 0, name: 'horizontal-reverse' },
    { dx: 0, dy: -1, name: 'vertical-reverse' },
    { dx: -1, dy: -1, name: 'diagonal-down-reverse' },
    { dx: -1, dy: 1, name: 'diagonal-up-reverse' }
  ]

  constructor(size: number = 15) {
    this.size = size
    this.grid = Array(size).fill(null).map(() => Array(size).fill(''))
  }

  generate(words: WordEntry[], maxWords: number = 15): GeneratedPuzzle | null {
    const filtered = words
      .filter(w => w.word.length >= 6 && w.word.length <= 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, maxWords * 2)

    if (filtered.length < 8) return null

    const sorted = [...filtered].sort((a, b) => b.word.length - a.word.length)

    let placed = 0
    for (const word of sorted) {
      if (placed >= maxWords) break
      if (this.placeWord(word.word.toUpperCase())) {
        placed++
      }
    }

    if (placed < 8) return null

    this.fillEmptyCells()

    const gridCells = this.grid.map((row, r) =>
      row.map((letter, c) => ({
        letter,
        row: r,
        col: c
      }))
    )

    const wordsWithDefs = this.placedWords.map(pw => {
      const wordEntry = filtered.find(w => w.word.toUpperCase() === pw.word)
      return {
        word: pw.word,
        definition: wordEntry?.definition || '',
        row: pw.row,
        col: pw.col,
        direction: pw.direction
      }
    })

    return {
      grid: gridCells,
      words: wordsWithDefs,
      size: this.size
    }
  }

  private placeWord(word: string): boolean {
    const shuffled = [...this.directions].sort(() => Math.random() - 0.5)
    
    for (let attempt = 0; attempt < 50; attempt++) {
      const row = Math.floor(Math.random() * this.size)
      const col = Math.floor(Math.random() * this.size)
      
      for (const dir of shuffled) {
        if (this.canPlaceWord(word, row, col, dir.dx, dir.dy)) {
          this.placeWordAt(word, row, col, dir.dx, dir.dy, dir.name)
          return true
        }
      }
    }
    return false
  }

  private canPlaceWord(word: string, row: number, col: number, dx: number, dy: number): boolean {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dy
      const newCol = col + i * dx
      
      if (newRow < 0 || newRow >= this.size || newCol < 0 || newCol >= this.size) {
        return false
      }
      
      const existing = this.grid[newRow][newCol]
      if (existing && existing !== word[i]) {
        return false
      }
    }
    return true
  }

  private placeWordAt(word: string, row: number, col: number, dx: number, dy: number, direction: string): void {
    for (let i = 0; i < word.length; i++) {
      this.grid[row + i * dy][col + i * dx] = word[i]
    }
    
    this.placedWords.push({ word, row, col, direction })
  }

  private fillEmptyCells(): void {
    // Use array instead of string to avoid UTF-8 length issues with accented chars
    const portugueseLetters = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Z',
      'Á', 'É', 'Í', 'Ó', 'Ú', 'Â', 'Ê', 'Ô', 'Ã', 'Õ', 'Ç'
    ]
    
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          this.grid[r][c] = portugueseLetters[Math.floor(Math.random() * portugueseLetters.length)]
        }
      }
    }
  }
}

serve(async (_req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  console.log(`[${requestId}] Starting daily word search generation`)
  
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
      .limit(200)

    if (wordsError) throw new Error(`Failed to fetch words: ${wordsError.message}`)
    if (!words || words.length < 15) throw new Error('Insufficient words in dictionary')

    console.log(`[${requestId}] Fetched ${words.length} words`)

    let puzzle: GeneratedPuzzle | null = null
    let attempts = 0
    const maxAttempts = 5

    while (!puzzle && attempts < maxAttempts) {
      attempts++
      const generator = new WordSearchGenerator(15)
      puzzle = generator.generate(words, 15)
      
      if (puzzle && puzzle.words.length >= 10) {
        console.log(`[${requestId}] Generated puzzle: ${puzzle.words.length} words`)
        break
      }
      puzzle = null
    }

    if (!puzzle) throw new Error('Failed to generate quality puzzle after 5 attempts')

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })
    
    const { data: existing } = await supabase
      .from('wordsearches')
      .select('id')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .maybeSingle()

    if (existing) {
      console.log(`[${requestId}] Puzzle already exists for ${today}`)
      return new Response(
        JSON.stringify({ 
          message: 'Word search already exists for today',
          puzzle_id: existing.id,
          date: today
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { data: inserted, error: insertError } = await supabase
      .from('wordsearches')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        words: puzzle.words,
        size: puzzle.size,
        publish_date: today
      })
      .select('id')
      .single()

    if (insertError) throw new Error(`Failed to insert: ${insertError.message}`)

    const totalTime = Date.now() - startTime

    console.log(`[${requestId}] SUCCESS in ${totalTime}ms: ${puzzle.words.length} words`)

    return new Response(
      JSON.stringify({
        success: true,
        puzzle_id: inserted.id,
        date: today,
        words_count: puzzle.words.length,
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
