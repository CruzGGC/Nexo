import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { CrosswordGenerator } from '@/lib/crossword-generator'

/**
 * GET /api/crossword/random
 * Generates and returns a new random crossword puzzle
 * Not saved to database - stateless generation
 */
export async function GET() {
  try {
    // Fetch all words from dictionary (3-10 characters) and randomize in-memory
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

    // Filter by length and shuffle in-memory
    const validWords = (allWords as Array<{ word: string; definition: string }>)
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
      grid_data: puzzle.grid,
      clues: puzzle.clues,
      solutions: {},
      publish_date: null,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao gerar puzzle aleatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar puzzle aleatório' },
      { status: 500 }
    )
  }
}
