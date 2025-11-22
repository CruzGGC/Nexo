import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/wordsearch/[id]
 * Returns a specific word search puzzle by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: puzzle, error } = await supabase
      .from('wordsearches')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !puzzle) {
      console.error('Erro ao buscar puzzle:', error)
      return NextResponse.json(
        { error: 'Puzzle não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(puzzle)
  } catch (error) {
    console.error('Erro ao buscar puzzle:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
