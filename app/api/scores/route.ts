import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/lib/database.types'
import type { ScoreGameType } from '@/lib/types/games'

export const dynamic = 'force-dynamic'

const gameTypes: ScoreGameType[] = ['crossword', 'wordsearch']

const isValidGameType = (value: unknown): value is ScoreGameType =>
  typeof value === 'string' && (gameTypes as readonly string[]).includes(value)

export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const { user_id, puzzle_id, time_ms, game_type } = body

    if (user_id && user_id !== authData.user.id) {
      return NextResponse.json(
        { error: 'Não é permitido registar pontuações para outro utilizador.' },
        { status: 403 }
      )
    }

    // Validação básica
    if (!user_id || !puzzle_id || !time_ms || !game_type) {
      return NextResponse.json(
        { error: 'Dados incompletos. Required: user_id, puzzle_id, time_ms, game_type' },
        { status: 400 }
      )
    }

    const parsedTime = Number.parseInt(time_ms, 10)

    if (!Number.isFinite(parsedTime) || parsedTime <= 0) {
      return NextResponse.json(
        { error: 'Tempo inválido' },
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

    // Insere a pontuação
    const payload: Database['public']['Tables']['scores']['Insert'] = {
      user_id: authData.user.id,
      game_type: normalizedGameType,
      puzzle_id: String(puzzle_id),
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
