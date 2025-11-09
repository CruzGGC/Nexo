import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Importar gerador de wordsearch (inline para Deno)
interface WordEntry {
  word: string
  definition: string
}

type Direction = 'E' | 'W' | 'S' | 'N' | 'SE' | 'SW' | 'NE' | 'NW'

interface WordPlacement {
  word: string
  definition: string
  startRow: number
  startCol: number
  direction: Direction
}

const DIRECTIONS: Record<Direction, { row: number; col: number }> = {
  E: { row: 0, col: 1 },
  W: { row: 0, col: -1 },
  S: { row: 1, col: 0 },
  N: { row: -1, col: 0 },
  SE: { row: 1, col: 1 },
  SW: { row: 1, col: -1 },
  NE: { row: -1, col: 1 },
  NW: { row: -1, col: -1 }
}

const PT_LETTERS = [
  'A', 'A', 'A', 'E', 'E', 'E', 'O', 'O', 'I', 'I',
  'S', 'R', 'N', 'D', 'M', 'U', 'T', 'C', 'L', 'P',
  'V', 'G', 'H', 'Q', 'B', 'F', 'Z', 'J', 'X', 'K'
]

class WordSearchGenerator {
  private gridSize: number
  private grid: string[][]
  private placedWords: WordPlacement[]

  constructor(gridSize: number = 15) {
    this.gridSize = gridSize
    this.grid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill('')
    )
    this.placedWords = []
  }

  generate(words: WordEntry[], maxWords: number = 10) {
    const validWords = words
      .filter(w => w.word.length >= 6 && w.word.length <= 12)
      .slice(0, maxWords)

    const normalizedWords = validWords.map(w => ({
      ...w,
      word: this.normalizeWord(w.word)
    }))

    normalizedWords.sort((a, b) => b.word.length - a.word.length)

    for (const wordEntry of normalizedWords) {
      this.placeWord(wordEntry)
    }

    this.fillEmptyCells()

    return {
      grid: this.grid,
      words: this.placedWords,
      size: this.gridSize
    }
  }

  private normalizeWord(word: string): string {
    return word
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  private placeWord(wordEntry: WordEntry): boolean {
    const { word } = wordEntry
    const directions = Object.keys(DIRECTIONS) as Direction[]
    const shuffledDirections = this.shuffle(directions)

    for (const direction of shuffledDirections) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const startRow = Math.floor(Math.random() * this.gridSize)
        const startCol = Math.floor(Math.random() * this.gridSize)

        if (this.canPlaceWord(word, startRow, startCol, direction)) {
          this.setWord(word, startRow, startCol, direction)
          this.placedWords.push({
            word,
            definition: wordEntry.definition,
            startRow,
            startCol,
            direction
          })
          return true
        }
      }
    }

    return false
  }

  private canPlaceWord(
    word: string,
    startRow: number,
    startCol: number,
    direction: Direction
  ): boolean {
    const { row: dRow, col: dCol } = DIRECTIONS[direction]

    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dRow
      const col = startCol + i * dCol

      if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
        return false
      }

      const cellValue = this.grid[row][col]
      if (cellValue !== '' && cellValue !== word[i]) {
        return false
      }
    }

    return true
  }

  private setWord(
    word: string,
    startRow: number,
    startCol: number,
    direction: Direction
  ): void {
    const { row: dRow, col: dCol } = DIRECTIONS[direction]

    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dRow
      const col = startCol + i * dCol
      this.grid[row][col] = word[i]
    }
  }

  private fillEmptyCells(): void {
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === '') {
          this.grid[row][col] = PT_LETTERS[Math.floor(Math.random() * PT_LETTERS.length)]
        }
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

serve(async (req) => {
  try {
    // Validar autenticação (service_role_key do cron)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar todas as palavras do dicionário e randomizar in-memory
    const { data: allWords, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')

    if (wordsError || !allWords || allWords.length === 0) {
      console.error('Erro ao buscar palavras:', wordsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch words' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Filtrar por tamanho e embaralhar in-memory
    const words = allWords
      .filter((w: any) => w.word.length >= 6 && w.word.length <= 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, 100)

    // Gerar puzzle (tentar até 5 vezes)
    let puzzle = null
    let attempts = 0
    const maxAttempts = 5

    while (!puzzle && attempts < maxAttempts) {
      try {
        const generator = new WordSearchGenerator(15)
        const result = generator.generate(words, 10)

        if (result.words.length >= 8) {
          puzzle = result
        }
      } catch (err) {
        console.warn(`Attempt ${attempts + 1} failed:`, err)
      }
      attempts++
    }

    if (!puzzle) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate quality puzzle' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Data atual (Portugal timezone)
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Lisbon'
    })

    // Inserir puzzle no banco de dados (tabela wordsearch)
    const { data: insertedPuzzle, error: insertError } = await supabase
      .from('wordsearch')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        words: puzzle.words, // Agora é 'words' em vez de 'clues'
        size: puzzle.size,
        publish_date: today
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir wordsearch:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert wordsearch', details: insertError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Daily word search puzzle generated successfully',
        puzzle: insertedPuzzle,
        wordsCount: puzzle.words.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
