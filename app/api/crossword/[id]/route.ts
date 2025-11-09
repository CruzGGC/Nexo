import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * GET /api/crossword/[id]
 * Returns a specific crossword puzzle by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: puzzle, error } = await supabase
      .from('crosswords')
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
