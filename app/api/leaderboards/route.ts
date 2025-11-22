import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type LeaderboardType = 'crossword' | 'wordsearch' | 'ratings'

const LEADERBOARD_CONFIG = {
  crossword: {
    view: 'leaderboard_crosswords',
    puzzleTable: 'crosswords'
  },
  wordsearch: {
    view: 'leaderboard_wordsearches',
    puzzleTable: 'wordsearches'
  }
} as const satisfies Record<
  'crossword' | 'wordsearch',
  {
    view: keyof Database['public']['Views']
    puzzleTable: keyof Database['public']['Tables']
  }
>

const RATING_GAME_TYPES = ['crossword', 'wordsearch', 'tic_tac_toe', 'battleship', 'crossword_duel', 'wordsearch_duel'] as const

const isLeaderboardType = (value: unknown): value is LeaderboardType =>
  value === 'crossword' || value === 'wordsearch' || value === 'ratings'

const isRatingGameType = (value: unknown): value is typeof RATING_GAME_TYPES[number] =>
  typeof value === 'string' && RATING_GAME_TYPES.includes(value as (typeof RATING_GAME_TYPES)[number])

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type') ?? 'crossword'

    if (!isLeaderboardType(typeParam)) {
      return NextResponse.json({ error: 'Tipo de leaderboard inválido' }, { status: 400 })
    }

    if (typeParam === 'ratings') {
      const gameTypeParam = searchParams.get('game_type')
      const requestedGameType = isRatingGameType(gameTypeParam)
        ? gameTypeParam
        : undefined

      let query = supabase
        .from('leaderboard_player_ratings')
        .select('*')
        .limit(50)
        .order('rating', { ascending: false })

      if (requestedGameType) {
        query = query.eq('game_type', requestedGameType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar leaderboard de ratings:', error)
        return NextResponse.json({ error: 'Falha ao carregar rankings globais' }, { status: 500 })
      }

      return NextResponse.json({ type: typeParam, entries: data ?? [] })
    }

    const config = LEADERBOARD_CONFIG[typeParam]
    const { data: latestPuzzle, error: latestError } = await supabase
      .from(config.puzzleTable)
      .select('id, publish_date')
      .eq('type', 'daily')
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      console.error('Erro ao determinar puzzle diário:', latestError)
      return NextResponse.json({ error: 'Falha ao carregar puzzle diário' }, { status: 500 })
    }

    if (!latestPuzzle) {
      return NextResponse.json({ type: typeParam, entries: [], puzzleId: null, puzzleDate: null })
    }

    const { data, error } = await supabase
      .from(config.view)
      .select('*')
      .eq('puzzle_id', latestPuzzle.id)
      .order('time_ms', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar leaderboard de puzzles:', error)
      return NextResponse.json({ error: 'Falha ao carregar leaderboard' }, { status: 500 })
    }

    return NextResponse.json({
      type: typeParam,
      entries: data ?? [],
      puzzleId: latestPuzzle.id,
      puzzleDate: latestPuzzle.publish_date
    })
  } catch (error) {
    console.error('Erro inesperado no endpoint /api/leaderboards:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}