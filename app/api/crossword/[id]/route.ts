import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { checkRateLimit, RateLimiters } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/crossword/[id]
 * Returns a specific crossword puzzle by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const { rateLimited, remaining } = await checkRateLimit(request, RateLimiters.puzzleFetch)
    
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: { 'X-RateLimit-Remaining': remaining.toString() }
        }
      )
    }

    const { id } = await params

    // Validate ID format (UUID or reasonable string)
    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

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
