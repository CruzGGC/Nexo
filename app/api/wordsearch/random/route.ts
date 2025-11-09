import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { WordSearchGenerator } from '@/lib/wordsearch-generator'

/**
 * GET /api/wordsearch/random
 * 
 * Gera e retorna um puzzle aleatório de sopa de letras
 * - Não salva no banco de dados (stateless)
 * - Usa palavras aleatórias da dictionary_pt
 * - Tenta 5 vezes para garantir qualidade
 */
export async function GET() {
  try {
    // Buscar todas as palavras do dicionário e randomizar in-memory
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

    // Filtrar por tamanho e embaralhar in-memory
    const validWords = (allWords as Array<{ word: string; definition: string }>)
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
      grid_data: puzzle.grid,
      words: puzzle.words,
      size: puzzle.size,
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
