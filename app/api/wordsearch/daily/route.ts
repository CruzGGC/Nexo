import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/wordsearch/daily
 * 
 * Retorna o puzzle diário de sopa de letras da tabela 'wordsearch'
 * - Busca puzzle do tipo 'daily' com publish_date = hoje
 * - Se não existir, retorna o mais recente
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

      if (latestError || !latestPuzzle) {
        return NextResponse.json(
          { error: 'Nenhum puzzle diário disponível' },
          { status: 404 }
        )
      }

      finalPuzzle = latestPuzzle
      isFromPreviousDay = true
    }

    // Garantir que puzzle não é null
    if (!finalPuzzle) {
      return NextResponse.json(
        { error: 'Puzzle não encontrado' },
        { status: 404 }
      )
    }

    // Parse JSONB columns if they come as strings from Supabase
    const puzzleData = finalPuzzle as any
    
    console.log('🔍 DEBUG - Raw puzzle data types:', {
      grid_data_type: typeof puzzleData.grid_data,
      words_type: typeof puzzleData.words,
      grid_data_sample: puzzleData.grid_data ? JSON.stringify(puzzleData.grid_data).substring(0, 100) : 'null',
      words_sample: puzzleData.words ? JSON.stringify(puzzleData.words).substring(0, 100) : 'null'
    })
    
    const gridData = typeof puzzleData.grid_data === 'string'
      ? JSON.parse(puzzleData.grid_data)
      : puzzleData.grid_data
    
    const words = typeof puzzleData.words === 'string'
      ? JSON.parse(puzzleData.words)
      : puzzleData.words

    console.log('✅ DEBUG - Parsed data:', {
      gridData_isArray: Array.isArray(gridData),
      gridData_length: gridData?.length,
      words_isArray: Array.isArray(words),
      words_length: words?.length,
      first_cell_sample: gridData?.[0]?.[0]
    })

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
