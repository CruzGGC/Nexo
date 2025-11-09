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
      .from('wordsearch')
      .select('*')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .single()

    let isFromPreviousDay = false
    let finalPuzzle = puzzle

    // Se não existe puzzle de hoje, buscar o mais recente
    if (error || !puzzle) {
      const { data: latestPuzzle, error: latestError } = await supabase
        .from('wordsearch')
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

    return NextResponse.json({
      id: (finalPuzzle as any).id,
      type: (finalPuzzle as any).type,
      grid_data: (finalPuzzle as any).grid_data,
      words: (finalPuzzle as any).words, // Agora é 'words' em vez de 'clues'
      size: (finalPuzzle as any).size,
      publish_date: (finalPuzzle as any).publish_date,
      created_at: (finalPuzzle as any).created_at,
      isFromPreviousDay
    })
  } catch (error) {
    console.error('Erro ao buscar puzzle diário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar puzzle diário' },
      { status: 500 }
    )
  }
}
