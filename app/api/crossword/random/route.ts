import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { CrosswordGenerator } from '@/lib/crossword/generator'
import { checkRateLimit, RateLimiters } from '@/lib/rate-limit'

type DictionaryEntry = { word: string; definition: string }
type CategorizedDictionaryRow = {
  dictionary_pt: {
    word: string
    definition: string
  }
}

export const dynamic = 'force-dynamic'

/**
 * Helper function to generate puzzle from words array
 */
async function generatePuzzleFromWords(
  allWords: Array<{ word: string; definition: string }>,
  category?: string | null
) {
  // Filter by length and shuffle in-memory
  const validWords = allWords
    .filter(w => w.word.length >= 3 && w.word.length <= 10)
    .sort(() => Math.random() - 0.5)
    .slice(0, 100)

  if (validWords.length === 0) {
    console.error('Nenhuma palavra válida encontrada')
    return NextResponse.json(
      { error: 'Dicionário vazio ou sem palavras válidas' },
      { status: 500 }
    )
  }

  const words = validWords

  // Try to generate puzzle up to 5 times
  const maxAttempts = 5
  let puzzle = null
  let attempts = 0

  while (!puzzle && attempts < maxAttempts) {
    try {
      const generator = new CrosswordGenerator()
      const result = generator.generate(words, 10) // 10 palavras

      // Validate that at least 6 words were placed
      if (result && result.clues.across.length + result.clues.down.length >= 6) {
        puzzle = result
      }
    } catch (err) {
      console.warn(`Attempt ${attempts + 1} failed:`, err)
    }
    attempts++
  }

  if (!puzzle) {
    return NextResponse.json(
      { error: 'Não foi possível gerar um puzzle de qualidade' },
      { status: 500 }
    )
  }

  // Format response similar to daily endpoint
  return NextResponse.json({
    id: `random-${Date.now()}`,
    type: 'random',
    category: category || null,
    grid_data: puzzle.grid,
    clues: puzzle.clues,
    solutions: {},
    quality: puzzle.quality,
    publish_date: null,
    created_at: new Date().toISOString()
  })
}

/**
 * GET /api/crossword/random?category=slug
 * Generates and returns a new random crossword puzzle
 * Not saved to database - stateless generation
 * Optional query param: category (e.g., 'animais', 'comida', 'desporto')
 */
export async function GET(request: Request) {
  try {
    // Rate limiting: 10 puzzle generations per minute (expensive operation)
    const { rateLimited, resetTime } = await checkRateLimit(
      request,
      RateLimiters.puzzleGeneration
    )

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Demasiados pedidos de geração. Por favor, aguarde um momento.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Parse query params for category filter
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // If category is specified, join with dictionary_categories
    if (category) {
      const { data: allWords, error } = await supabase
        .from('dictionary_categories')
        .select(`
          word,
          dictionary_pt!inner(word, definition),
          word_categories!inner(slug)
        `)
        .eq('word_categories.slug', category)

      if (error || !allWords || allWords.length === 0) {
        console.error('Erro ao buscar palavras com categoria:', error)
        return NextResponse.json(
          { error: `Nenhuma palavra encontrada para categoria "${category}"` },
          { status: 404 }
        )
      }

      // Transform joined data to flat structure
      const typedWords = (allWords as CategorizedDictionaryRow[]).map(item => ({
        word: item.dictionary_pt.word,
        definition: item.dictionary_pt.definition
      }))

      return await generatePuzzleFromWords(typedWords, category)
    }

    // No category filter - fetch all words
    const { data: allWords, error } = await supabase
      .from('dictionary_pt')
      .select('word, definition')

    if (error || !allWords || allWords.length === 0) {
      console.error('Erro ao buscar palavras:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar palavras do dicionário' },
        { status: 500 }
      )
    }

    return await generatePuzzleFromWords(allWords as DictionaryEntry[], null)
  } catch (error) {
    console.error('Erro ao gerar puzzle aleatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar puzzle aleatório' },
      { status: 500 }
    )
  }
}
