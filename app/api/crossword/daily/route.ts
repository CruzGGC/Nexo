import { supabase } from '@/lib/supabase'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CrosswordGenerator } from '@/lib/games/crossword'
import { checkRateLimit, RateLimiters } from '@/lib/rate-limit'
import type { Database } from '@/lib/supabase'

export const revalidate = 3600 // cache daily puzzle for one hour as recommended by Next.js caching docs

/**
 * GET /api/crossword/daily
 * Returns today's daily crossword puzzle from 'crosswords' table
 * All players get the same puzzle for the day
 * Falls back to generating a new puzzle if none exists
 */
export async function GET(request: Request) {
  try {
    // Rate limiting: 120 requests per minute for read operations
    const { rateLimited, resetTime } = await checkRateLimit(
      request,
      { ...RateLimiters.lenient, identifier: 'crossword-daily' }
    )

    if (rateLimited) {
      return NextResponse.json(
        { error: 'Demasiados pedidos. Por favor, aguarde um momento.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })

    // First try to get today's puzzle
    const { data: todayPuzzle, error: todayError } = await supabase
      .from('crosswords')
      .select('*')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .maybeSingle()

    if (!todayError && todayPuzzle) {
      return NextResponse.json({
        ...todayPuzzle,
        isFromPreviousDay: false,
        servedForDate: today
      })
    }

    // Try to get most recent puzzle
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

    // If there's a recent puzzle, return it with isFromPreviousDay flag
    if (latestPuzzle) {
      const isFromPreviousDay = Boolean(latestPuzzle.publish_date && latestPuzzle.publish_date !== today)
      return NextResponse.json({
        ...latestPuzzle,
        isFromPreviousDay,
        servedForDate: today
      })
    }

    // FALLBACK: Generate a new puzzle on-the-fly
    console.log('No daily puzzle found, generating on-the-fly...')
    
    const { data: words, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .not('definition', 'is', null)
      .limit(150)

    if (wordsError || !words || words.length < 20) {
      console.error('Insufficient words for puzzle generation:', wordsError)
      return NextResponse.json(
        {
          error: 'Nenhum puzzle diário disponível',
          message: 'Não há palavras suficientes no dicionário para gerar um puzzle.'
        },
        { status: 404 }
      )
    }

    // Shuffle words for variety
    const shuffledWords = [...words].sort(() => Math.random() - 0.5)
    
    let puzzle = null
    let attempts = 0
    const maxAttempts = 5

    while (!puzzle && attempts < maxAttempts) {
      attempts++
      const generator = new CrosswordGenerator(15)
      const result = generator.generate(shuffledWords, 12)
      
      if (result && result.quality.score >= 40) {
        puzzle = result
        break
      }
    }

    if (!puzzle) {
      return NextResponse.json(
        {
          error: 'Falha ao gerar puzzle',
          message: 'Não foi possível gerar um puzzle de qualidade. Tente novamente.'
        },
        { status: 500 }
      )
    }

    // Save the generated puzzle using service role client (bypasses RLS)
    const serviceClient = createServiceSupabaseClient()
    const { data: inserted, error: insertError } = await serviceClient
      .from('crosswords')
      .insert({
        type: 'daily' as const,
        grid_data: puzzle.grid as unknown as Database['public']['Tables']['crosswords']['Insert']['grid_data'],
        clues: puzzle.clues as unknown as Database['public']['Tables']['crosswords']['Insert']['clues'],
        solutions: {} as unknown as Database['public']['Tables']['crosswords']['Insert']['solutions'],
        quality_score: puzzle.quality.score,
        publish_date: today
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save generated puzzle:', insertError)
      // Return the generated puzzle anyway, just don't save it
      return NextResponse.json({
        id: 'temp-' + Date.now(),
        type: 'daily',
        grid_data: puzzle.grid,
        clues: puzzle.clues,
        publish_date: today,
        isFromPreviousDay: false,
        servedForDate: today,
        generated: true
      })
    }

    return NextResponse.json({
      ...inserted,
      isFromPreviousDay: false,
      servedForDate: today,
      generated: true
    })
  } catch (error) {
    console.error('Erro ao buscar puzzle diário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
