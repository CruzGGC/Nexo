import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type LeaderboardType = 'crossword' | 'wordsearch' | 'ratings'

const PUZZLE_TABLE = {
  crossword: 'leaderboard_crosswords',
  wordsearch: 'leaderboard_wordsearches'
} as const satisfies Record<'crossword' | 'wordsearch', keyof Database['public']['Views']>

const RATING_GAME_TYPES = ['crossword', 'wordsearch', 'tic_tac_toe', 'battleship'] as const

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

    const table = PUZZLE_TABLE[typeParam]
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(10)

    if (error) {
      console.error('Erro ao buscar leaderboard de puzzles:', error)
      return NextResponse.json({ error: 'Falha ao carregar leaderboard' }, { status: 500 })
    }

    return NextResponse.json({ type: typeParam, entries: data ?? [] })
  } catch (error) {
    console.error('Erro inesperado no endpoint /api/leaderboards:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}