import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { checkRateLimit, RateLimiters } from '@/lib/rate-limit'
import type { Database } from '@/lib/database.types'
import type { ScoreGameType } from '@/lib/types/games'

export const dynamic = 'force-dynamic'

const gameTypes: ScoreGameType[] = ['crossword', 'wordsearch']

// Maximum reasonable time for completing a puzzle (2 hours in ms)
const MAX_TIME_MS = 2 * 60 * 60 * 1000
// Minimum reasonable time (1 second - prevents impossible scores)
const MIN_TIME_MS = 1000

const isValidGameType = (value: unknown): value is ScoreGameType =>
  typeof value === 'string' && (gameTypes as readonly string[]).includes(value)

export async function POST(request: Request) {
  try {
    // First validate auth to determine if user is guest
    const accessToken = extractBearerToken(request)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Não autenticado. Faça login para guardar pontuações.' },
        { status: 401 }
      )
    }

    const serviceClient = createServiceSupabaseClient()
    const { data: authData, error: authError } = await serviceClient.auth.getUser(accessToken)

    if (authError || !authData?.user) {
      console.error('Erro ao validar sessão do utilizador:', authError)
      return NextResponse.json(
        { error: 'Sessão inválida. Por favor, autentique-se novamente.' },
        { status: 401 }
      )
    }

    // Rate limiting: stricter for guests
    const isGuest = authData.user.is_anonymous === true
    const rateLimitConfig = isGuest 
      ? RateLimiters.guestScoreSubmission 
      : RateLimiters.scoreSubmission

    const { rateLimited, remaining, resetTime } = await checkRateLimit(
      request,
      rateLimitConfig
    )

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Demasiados pedidos. Por favor, aguarde um momento.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const body = await request.json()
    const { puzzle_id, time_ms, game_type } = body

    // SECURITY: Always use the authenticated user ID, never trust body.user_id
    const userId = authData.user.id

    // Validação básica
    if (!puzzle_id || !time_ms || !game_type) {
      return NextResponse.json(
        { error: 'Dados incompletos. Required: puzzle_id, time_ms, game_type' },
        { status: 400 }
      )
    }

    const parsedTime = Number.parseInt(time_ms, 10)

    if (!Number.isFinite(parsedTime) || parsedTime < MIN_TIME_MS) {
      return NextResponse.json(
        { error: 'Tempo inválido - valor demasiado baixo' },
        { status: 400 }
      )
    }

    if (parsedTime > MAX_TIME_MS) {
      return NextResponse.json(
        { error: 'Tempo inválido - valor excede o máximo permitido' },
        { status: 400 }
      )
    }

    if (!isValidGameType(game_type)) {
      return NextResponse.json(
        { error: 'game_type deve ser "crossword" ou "wordsearch"' },
        { status: 400 }
      )
    }

    const normalizedGameType: ScoreGameType = game_type
    const puzzleIdStr = String(puzzle_id)

    // SECURITY: Validate puzzle_id exists in database (skip for random/temp puzzles)
    // Random puzzles use format: random-{timestamp}
    const isRandomPuzzle = puzzleIdStr.startsWith('random-')
    const isTempPuzzle = puzzleIdStr.startsWith('temp-')
    
    if (isTempPuzzle) {
      return NextResponse.json(
        { error: 'Este puzzle temporário não pode ter pontuações guardadas.' },
        { status: 400 }
      )
    }

    if (!isRandomPuzzle) {
      // Validate that the puzzle exists in the appropriate table
      const tableName = normalizedGameType === 'crossword' ? 'crosswords' : 'wordsearches'
      const { data: puzzleExists, error: puzzleError } = await serviceClient
        .from(tableName)
        .select('id')
        .eq('id', puzzleIdStr)
        .maybeSingle()

      if (puzzleError) {
        console.error('Error validating puzzle:', puzzleError)
        // Don't block score submission on validation errors, just log
      } else if (!puzzleExists) {
        return NextResponse.json(
          { error: 'Puzzle não encontrado. Não é possível guardar a pontuação.' },
          { status: 404 }
        )
      }
    }

    // Insere a pontuação
    const payload: Database['public']['Tables']['scores']['Insert'] = {
      user_id: userId,
      game_type: normalizedGameType,
      puzzle_id: puzzleIdStr,
      time_ms: parsedTime,
    }

    const adminDb = serviceClient as unknown as typeof supabase

    const { data, error } = await adminDb
      .from('scores')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Erro ao guardar pontuação:', error)
      return NextResponse.json(
        { error: 'Erro ao guardar pontuação' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function extractBearerToken(request: Request) {
  const header = request.headers.get('authorization')
  if (!header) {
    return null
  }

  const [scheme, token] = header.split(' ')
  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return null
  }

  return token
}

// Buscar as melhores pontuações para um puzzle
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const puzzle_id = searchParams.get('puzzle_id')
    const game_type = searchParams.get('game_type')

    if (!puzzle_id) {
      return NextResponse.json(
        { error: 'ID do puzzle é obrigatório' },
        { status: 400 }
      )
    }

    if (!isValidGameType(game_type)) {
      return NextResponse.json(
        { error: 'game_type deve ser "crossword" ou "wordsearch"' },
        { status: 400 }
      )
    }

    const { data: scores, error } = await supabase
      .from('scores')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('puzzle_id', puzzle_id)
      .eq('game_type', game_type)
      .order('time_ms', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar pontuações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pontuações' },
        { status: 500 }
      )
    }

    return NextResponse.json(scores)
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
