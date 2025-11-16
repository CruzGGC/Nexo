import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const revalidate = 3600 // cache daily puzzle for one hour as recommended by Next.js caching docs

/**
 * GET /api/crossword/daily
 * Returns today's daily crossword puzzle from 'crosswords' table
 * All players get the same puzzle for the day
 */
export async function GET() {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })

    const { data: latestPuzzle, error } = await supabase
      .from('crosswords')
      .select('*')
      .eq('type', 'daily')
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar puzzle diário:', error)
      return NextResponse.json({ error: 'Falha ao carregar puzzle diário' }, { status: 500 })
    }

    if (!latestPuzzle) {
      return NextResponse.json(
        {
          error: 'Nenhum puzzle diário disponível',
          message: 'O puzzle diário será gerado à meia-noite. Por favor, tente novamente mais tarde.'
        },
        { status: 404 }
      )
    }

    const isFromPreviousDay = Boolean(latestPuzzle.publish_date && latestPuzzle.publish_date !== today)

    return NextResponse.json({
      ...latestPuzzle,
      isFromPreviousDay,
      servedForDate: today
    })
  } catch (error) {
    console.error('Erro ao buscar puzzle diário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
