import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { WordSearchGenerator } from '@/lib/wordsearch-generator'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type WordsearchRow = {
  id: string
  type: string
  grid_data: unknown
  words: unknown
  publish_date: string
}

/**
 * GET /api/wordsearch/daily
 * 
 * Retorna o puzzle diário de sopa de letras da tabela 'wordsearch'
 * - Busca puzzle do tipo 'daily' com publish_date = hoje
 * - Se não existir, tenta gerar um novo automaticamente
 * - Portugal timezone (Europe/Lisbon)
 */
export async function GET() {
  try {
    // Data atual em Portugal (Europe/Lisbon)
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Lisbon'
    }) // Formato: YYYY-MM-DD

    // Buscar puzzle do dia
    const { data: puzzle, error } = await supabase
      .from('wordsearches')
      .select('*')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .single()

    let isFromPreviousDay = false
    let finalPuzzle = puzzle

    // Se não existe puzzle de hoje, buscar o mais recente
    if (error || !puzzle) {
      const { data: latestPuzzle, error: latestError } = await supabase
        .from('wordsearches')
        .select('*')
        .eq('type', 'daily')
        .order('publish_date', { ascending: false })
        .limit(1)
        .single()

      if (!latestError && latestPuzzle) {
        finalPuzzle = latestPuzzle
        isFromPreviousDay = true
      } else {
        // FALLBACK: Generate a new puzzle on-the-fly
        console.log('No daily wordsearch found, generating on-the-fly...')
        
        const { data: words, error: wordsError } = await supabase
          .from('dictionary_pt')
          .select('word, definition')
          .not('definition', 'is', null)
          .limit(100)

        if (wordsError || !words || words.length < 15) {
          console.error('Insufficient words for puzzle generation:', wordsError)
          return NextResponse.json(
            { error: 'Nenhum puzzle diário disponível e não há palavras suficientes para gerar' },
            { status: 404 }
          )
        }

        // Shuffle words for variety
        const shuffledWords = [...words].sort(() => Math.random() - 0.5)
        
        let generatedPuzzle = null
        let attempts = 0
        const maxAttempts = 5

        while (!generatedPuzzle && attempts < maxAttempts) {
          attempts++
          const generator = new WordSearchGenerator(15)
          const result = generator.generate(shuffledWords, 12)
          
          if (result && result.words.length >= 8) {
            generatedPuzzle = result
            break
          }
        }

        if (!generatedPuzzle) {
          return NextResponse.json(
            { error: 'Falha ao gerar puzzle de sopa de letras' },
            { status: 500 }
          )
        }

        // Convert grid to the expected format with row/col info
        const gridData = generatedPuzzle.grid.map((row, r) =>
          row.map((letter, c) => ({
            letter: letter,
            row: r,
            col: c
          }))
        )

        // Try to save the generated puzzle using service role client (bypasses RLS)
        const serviceClient = createServiceSupabaseClient()
        const { data: inserted, error: insertError } = await serviceClient
          .from('wordsearches')
          .insert({
            type: 'daily' as const,
            grid_data: gridData as unknown as Database['public']['Tables']['wordsearches']['Insert']['grid_data'],
            words: generatedPuzzle.words as unknown as Database['public']['Tables']['wordsearches']['Insert']['words'],
            publish_date: today,
            size: generatedPuzzle.size
          })
          .select()
          .single()

        if (insertError) {
          console.error('Failed to save generated wordsearch:', insertError)
          // Return the generated puzzle anyway
          return NextResponse.json({
            id: 'temp-' + Date.now(),
            type: 'daily',
            grid_data: gridData,
            words: generatedPuzzle.words,
            publish_date: today,
            isFromPreviousDay: false,
            generated: true
          })
        }

        return NextResponse.json({
          id: inserted.id,
          type: inserted.type,
          grid_data: gridData,
          words: generatedPuzzle.words,
          publish_date: today,
          isFromPreviousDay: false,
          generated: true
        })
      }
    }

    // Garantir que puzzle não é null
    if (!finalPuzzle) {
      return NextResponse.json(
        { error: 'Puzzle não encontrado' },
        { status: 404 }
      )
    }

    const puzzleData = finalPuzzle as WordsearchRow

    const gridData = typeof puzzleData.grid_data === 'string'
      ? JSON.parse(puzzleData.grid_data)
      : puzzleData.grid_data
    
    const words = typeof puzzleData.words === 'string'
      ? JSON.parse(puzzleData.words)
      : puzzleData.words

    return NextResponse.json({
      id: puzzleData.id,
      type: puzzleData.type,
      grid_data: gridData,
      words: words,
      publish_date: puzzleData.publish_date,
      isFromPreviousDay: isFromPreviousDay
    })
  } catch (error) {
    console.error('Erro ao buscar puzzle diário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar puzzle diário' },
      { status: 500 }
    )
  }
}
