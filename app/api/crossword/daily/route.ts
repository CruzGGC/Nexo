import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/crossword/daily
 * Returns today's daily crossword puzzle from 'crosswords' table
 * All players get the same puzzle for the day
 */
export async function GET() {
  try {
    // Get today's date in Portugal timezone (Europe/Lisbon)
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Lisbon'
    }) // Formato: YYYY-MM-DD

    // Fetch today's daily crossword
    const { data: puzzle, error } = await supabase
      .from('crosswords')
      .select('*')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .single()

    if (error || !puzzle) {
      // If no puzzle for today, try to get the most recent one
      console.warn('No puzzle for today, fetching most recent:', error)
      
      const { data: recentPuzzle, error: recentError } = await supabase
        .from('crosswords')
        .select('*')
        .eq('type', 'daily')
        .order('publish_date', { ascending: false })
        .limit(1)
        .single()

      if (recentError || !recentPuzzle) {
        console.error('Erro ao buscar puzzle diário:', recentError)
        return NextResponse.json(
          { 
            error: 'Nenhum puzzle diário disponível',
            message: 'O puzzle diário será gerado à meia-noite. Por favor, tente novamente mais tarde.',
          },
          { status: 404 }
        )
      }

      // Return most recent puzzle with flag
      const latestPuzzle = recentPuzzle as Record<string, unknown>
      return NextResponse.json({
        ...latestPuzzle,
        isFromPreviousDay: true
      })
    }

    return NextResponse.json(puzzle)
  } catch (error) {
    console.error('Erro ao buscar puzzle diário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
