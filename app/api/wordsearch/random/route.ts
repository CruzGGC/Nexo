import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { WordSearchGenerator } from '@/lib/games/wordsearch'
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
  // Filtrar por tamanho e embaralhar in-memory
  const validWords = allWords
    .filter(w => w.word.length >= 6 && w.word.length <= 10)
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

  // Tentar gerar puzzle até 5 vezes
  const maxAttempts = 5
  let puzzle = null
  let attempts = 0

  while (!puzzle && attempts < maxAttempts) {
    try {
      const generator = new WordSearchGenerator(15)
      const result = generator.generate(words, 10) // 10 palavras

      // Validar que conseguiu colocar pelo menos 6 palavras
      if (result.words.length >= 6) {
        puzzle = result
      }
    } catch (err) {
      console.warn(`Tentativa ${attempts + 1} falhou:`, err)
    }
    attempts++
  }

  if (!puzzle) {
    return NextResponse.json(
      { error: 'Não foi possível gerar um puzzle de qualidade' },
      { status: 500 }
    )
  }

  // Formatar resposta no mesmo formato que daily
  return NextResponse.json({
    id: `random-${Date.now()}`,
    type: 'random',
    category: category || null,
    grid_data: puzzle.grid,
    words: puzzle.words,
    size: puzzle.size,
    publish_date: null,
    created_at: new Date().toISOString()
  })
}

/**
 * GET /api/wordsearch/random?category=slug
 * 
 * Gera e retorna um puzzle aleatório de sopa de letras
 * - Não salva no banco de dados (stateless)
 * - Usa palavras aleatórias da dictionary_pt
 * - Tenta 5 vezes para garantir qualidade
 * - Parâmetro opcional: category (e.g., 'animais', 'comida', 'desporto')
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
      const words = (allWords as CategorizedDictionaryRow[]).map(item => ({
        word: item.dictionary_pt.word,
        definition: item.dictionary_pt.definition
      }))

      return await generatePuzzleFromWords(words, category)
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
