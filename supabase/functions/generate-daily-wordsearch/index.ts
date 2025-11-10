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
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[${requestId}] 🚀 Starting daily word search generation`);
  
  try {
    // Validar autenticação (service_role_key do cron)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn(`[${requestId}] ⚠️ Missing authorization header`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', request_id: requestId }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[${requestId}] ✅ Supabase client initialized`);

    // Buscar todas as palavras do dicionário e randomizar in-memory
    const wordsStartTime = Date.now();
    const { data: allWords, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition');

    if (wordsError || !allWords || allWords.length === 0) {
      console.error(`[${requestId}] ❌ Failed to fetch words:`, wordsError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch words',
          request_id: requestId 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] 📚 Fetched ${allWords.length} words in ${Date.now() - wordsStartTime}ms`);

    // Filtrar por tamanho e embaralhar in-memory
    const words = allWords
      .filter((w: any) => w.word.length >= 6 && w.word.length <= 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, 100);

    console.log(`[${requestId}] 🔍 Filtered to ${words.length} suitable words (6-10 chars)`);

    // Gerar puzzle (tentar até 5 vezes)
    let puzzle = null;
    let attempts = 0;
    const maxAttempts = 5;
    let bestAttempt: any = null;
    let bestWordCount = 0;

    const genStartTime = Date.now();
    while (!puzzle && attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] 🎲 Generation attempt ${attempts}/${maxAttempts}`);
      
      try {
        const generator = new WordSearchGenerator(15);
        const result = generator.generate(words, 10);

        const wordCount = result.words.length;
        console.log(`[${requestId}] ✅ Attempt ${attempts} generated puzzle with ${wordCount} words`);

        if (wordCount > bestWordCount) {
          bestAttempt = result;
          bestWordCount = wordCount;
        }

        if (wordCount >= 8) {
          puzzle = result;
          console.log(`[${requestId}] 🎉 Accepted puzzle with ${wordCount} words (quality threshold met)`);
          break;
        }
      } catch (err) {
        console.warn(`[${requestId}] ⚠️ Attempt ${attempts} failed:`, err);
      }
    }

    // Use best attempt if no puzzle met quality threshold
    if (!puzzle && bestAttempt) {
      puzzle = bestAttempt;
      console.log(`[${requestId}] ⚠️ Using best attempt with ${bestWordCount} words (below ideal threshold)`);
    }

    if (!puzzle) {
      console.error(`[${requestId}] ❌ Failed to generate puzzle after ${maxAttempts} attempts`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate quality puzzle',
          request_id: requestId,
          elapsed_ms: Date.now() - startTime
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const genTime = Date.now() - genStartTime;
    console.log(`[${requestId}] ⏱️ Generation completed in ${genTime}ms (${attempts} attempts)`);

    // Data atual (Portugal timezone)
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Lisbon'
    });
    console.log(`[${requestId}] 📅 Target date: ${today} (Portugal timezone)`);

    // Inserir puzzle no banco de dados (tabela wordsearch)
    const insertStartTime = Date.now();
    const { data: insertedPuzzle, error: insertError } = await supabase
      .from('wordsearch')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        words: puzzle.words,
        size: puzzle.size,
        publish_date: today
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${requestId}] ❌ Failed to insert wordsearch:`, insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert wordsearch', 
          details: insertError,
          request_id: requestId
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const insertTime = Date.now() - insertStartTime;
    const totalTime = Date.now() - startTime;
    
    console.log(`[${requestId}] 💾 Saved to database in ${insertTime}ms`);
    console.log(`[${requestId}] ✅ SUCCESS - Total time: ${totalTime}ms`);
    console.log(`[${requestId}] 📊 Stats: ${puzzle.words.length} words, grid size ${puzzle.size}x${puzzle.size}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily word search puzzle generated successfully',
        puzzle: insertedPuzzle,
        words_count: puzzle.words.length,
        generation_time_ms: genTime,
        total_time_ms: totalTime,
        attempts: attempts
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ ERROR after ${totalTime}ms:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        request_id: requestId,
        elapsed_ms: totalTime
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
