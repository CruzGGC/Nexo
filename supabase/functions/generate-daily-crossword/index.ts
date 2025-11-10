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
    let totalIntersections = 0
    
    for (let i = 1; i < shuffled.length && wordsPlaced < maxWords; i++) {
      const intersections = this.tryPlaceWordWithScore(shuffled[i])
      if (intersections > 0) {
        wordsPlaced++
        totalIntersections += intersections
      }
    }

    if (wordsPlaced < 5) return null

    // Quality check
    const avgIntersections = totalIntersections / wordsPlaced
    if (avgIntersections < 0.4) return null

    this.trimGrid()
    this.assignNumbers()
    
    const puzzle = this.buildPuzzle()
    const filledCells = this.placedWords.reduce((sum, word) => sum + word.word.length, 0)
    const totalCells = this.grid.length * this.grid[0].length
    const density = filledCells / totalCells
    
    return {
      ...puzzle,
      quality: {
        intersections: totalIntersections,
        density: Math.round(density * 100) / 100,
        score: Math.min(100, Math.round((wordsPlaced * 10) + (avgIntersections * 50) + (density * 30)))
      }
    }
  }

  private tryPlaceWordWithScore(word: WordEntry): number {
    const wordUpper = word.word.toUpperCase()
    let bestIntersections = 0
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down' } | null = null

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

  private countIntersections(word: WordEntry, row: number, col: number, direction: 'across' | 'down'): number {
    const wordUpper = word.word.toUpperCase()
    let intersections = 0

    if (direction === 'across' && col + wordUpper.length > this.gridSize) return 0
    if (direction === 'down' && row + wordUpper.length > this.gridSize) return 0

    for (let i = 0; i < wordUpper.length; i++) {
      const r = direction === 'across' ? row : row + i
      const c = direction === 'across' ? col + i : col
      if (this.grid[r][c].letter) {
        if (this.grid[r][c].letter === wordUpper[i]) {
          intersections++
        } else {
          return 0
        }
      }
    }
    return intersections
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
      // Include direction in the key to allow both across and down at same position
      const key = `${word.row},${word.col},${word.direction}`
      if (!numbered.has(key)) {
        // Check if this position already has a number (from another direction)
        const existingNumber = this.grid[word.row][word.col].number
        
        if (existingNumber) {
          // Reuse the existing number for this position
          word.number = existingNumber
        } else {
          // Assign new number
          word.number = number
          this.grid[word.row][word.col].number = number
          number++
        }
        
        numbered.add(key)
      }
    }
  }

  private buildPuzzle() {
    // First, mark all cells that belong to placed words
    const validCells = new Set<string>()
    for (const word of this.placedWords) {
      for (let i = 0; i < word.word.length; i++) {
        const r = word.direction === 'across' ? word.row : word.row + i
        const c = word.direction === 'across' ? word.col + i : word.col
        validCells.add(`${r},${c}`)
      }
    }

    // Build grid, only including cells that belong to placed words
    const grid = this.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const key = `${rowIndex},${colIndex}`
        const isValid = validCells.has(key)
        
        return {
          value: '',
          correct: isValid ? cell.letter : '', // Only set correct value for valid cells
          number: cell.number,
          isBlack: !isValid || cell.isBlack, // Mark invalid cells as black
          row: rowIndex,
          col: colIndex,
        }
      })
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
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[${requestId}] 🚀 Starting daily crossword generation`);
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[${requestId}] ✅ Supabase client initialized`);

    // Get all words from dictionary and randomize in-memory
    const wordsStartTime = Date.now();
    const { data: allWords, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .not('definition', 'is', null);

    if (wordsError) {
      console.error(`[${requestId}] ❌ Failed to fetch words:`, wordsError);
      throw new Error(`Failed to fetch words: ${wordsError.message}`);
    }

    if (!allWords || allWords.length === 0) {
      console.error(`[${requestId}] ❌ No words found in dictionary`);
      throw new Error('No words found in dictionary');
    }

    console.log(`[${requestId}] 📚 Fetched ${allWords.length} words in ${Date.now() - wordsStartTime}ms`);

    // Filter by length and randomize in-memory
    const words = allWords
      .filter((w: any) => w.word.length >= 3 && w.word.length <= 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, 100);

    console.log(`[${requestId}] 🔍 Filtered to ${words.length} suitable words (3-10 chars)`);

    // Generate crossword (try up to 5 times for a good puzzle)
    let puzzle: any = null;
    let attempts = 0;
    const maxAttempts = 5;
    let bestAttempt: any = null;
    let bestQualityScore = 0;

    const genStartTime = Date.now();
    while (!puzzle && attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] 🎲 Generation attempt ${attempts}/${maxAttempts}`);
      
      const generator = new CrosswordGenerator(15);
      const result = generator.generate(words, 12);
      
      if (result) {
        const wordCount = result.clues.across.length + result.clues.down.length;
        const quality = result.quality;
        console.log(`[${requestId}] ✅ Attempt ${attempts}: ${wordCount} words, quality score ${quality.score}, intersections ${quality.intersections}, density ${quality.density}`);
        
        // Quality check: prefer puzzles with higher quality score
        if (quality.score > bestQualityScore) {
          bestAttempt = result;
          bestQualityScore = quality.score;
        }
        
        // Accept if we have at least 8 words and quality score >= 60
        if (wordCount >= 8 && quality.score >= 60) {
          puzzle = result;
          console.log(`[${requestId}] 🎉 Accepted puzzle with ${wordCount} words, quality score ${quality.score} (threshold met)`);
          break;
        }
      } else {
        console.log(`[${requestId}] ⚠️ Attempt ${attempts} failed to generate valid puzzle (low quality or conflicts)`);
      }
    }

    // Use best attempt if no puzzle met quality threshold
    if (!puzzle && bestAttempt) {
      puzzle = bestAttempt;
      const wordCount = puzzle.clues.across.length + puzzle.clues.down.length;
      console.log(`[${requestId}] ⚠️ Using best attempt: ${wordCount} words, quality score ${bestQualityScore} (below ideal threshold)`);
    }

    if (!puzzle) {
      console.error(`[${requestId}] ❌ Failed to generate puzzle after ${maxAttempts} attempts`);
      throw new Error('Failed to generate puzzle after multiple attempts');
    }

    const genTime = Date.now() - genStartTime;
    const wordCount = puzzle.clues.across.length + puzzle.clues.down.length;
    console.log(`[${requestId}] ⏱️ Generation completed in ${genTime}ms (${attempts} attempts)`);
    console.log(`[${requestId}] 📊 Final quality: score ${puzzle.quality.score}, ${puzzle.quality.intersections} intersections, ${puzzle.quality.density} density`);

    // Get today's date in Portugal timezone
    const today = new Date();
    const portugalDate = new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Europe/Lisbon',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    const [day, month, year] = portugalDate.split('/');
    const publishDate = `${year}-${month}-${day}`;
    console.log(`[${requestId}] 📅 Target date: ${publishDate} (Portugal timezone)`);

    // Check if crossword for today already exists
    const { data: existingPuzzle } = await supabase
      .from('crosswords')
      .select('id')
      .eq('type', 'daily')
      .eq('publish_date', publishDate)
      .single();

    if (existingPuzzle) {
      console.log(`[${requestId}] ℹ️ Crossword already exists for ${publishDate}`);
      return new Response(
        JSON.stringify({ 
          message: 'Crossword already exists for today',
          date: publishDate,
          puzzle_id: existingPuzzle.id
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Insert crossword into database
    const insertStartTime = Date.now();
    const { data: insertedPuzzle, error: insertError } = await supabase
      .from('crosswords')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        clues: puzzle.clues,
        solutions: {}, // Not used, answers are in grid_data
        publish_date: publishDate,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${requestId}] ❌ Failed to insert crossword:`, insertError);
      throw new Error(`Failed to insert crossword: ${insertError.message}`);
    }

    const insertTime = Date.now() - insertStartTime;
    const totalTime = Date.now() - startTime;
    
    const finalWordCount = puzzle.clues.across.length + puzzle.clues.down.length;
    console.log(`[${requestId}] 💾 Saved to database in ${insertTime}ms`);
    console.log(`[${requestId}] ✅ SUCCESS - Total time: ${totalTime}ms`);
    console.log(`[${requestId}] 📊 Stats: ${finalWordCount} words (${puzzle.clues.across.length} across, ${puzzle.clues.down.length} down)`);

    return new Response(
      JSON.stringify({
        success: true,
        puzzle_id: insertedPuzzle.id,
        date: publishDate,
        words_count: finalWordCount,
        quality_score: puzzle.quality.score,
        intersections: puzzle.quality.intersections,
        density: puzzle.quality.density,
        generation_time_ms: genTime,
        total_time_ms: totalTime,
        attempts: attempts,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ ERROR after ${totalTime}ms:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
        request_id: requestId,
        elapsed_ms: totalTime
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
