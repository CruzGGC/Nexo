// Supabase Edge Function: Generate Daily Crossword
/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CrosswordGenerator, type WordEntry } from '../../../lib/crossword/generator.ts'

type GeneratedPuzzle = NonNullable<ReturnType<CrosswordGenerator['generate']>>

serve(async (_req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  console.log(`[${requestId}] Starting daily crossword generation`)
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: words, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .not('definition', 'is', null)
      .gte('word', 'aaa')
      .limit(150)

    if (wordsError) throw new Error(`Failed to fetch words: ${wordsError.message}`)
    if (!words || words.length < 20) throw new Error('Insufficient words in dictionary')

    console.log(`[${requestId}] Fetched ${words.length} words`)

    let puzzle: GeneratedPuzzle | null = null
    let attempts = 0
    const maxAttempts = 5

    while (!puzzle && attempts < maxAttempts) {
      attempts++
      const generator = new CrosswordGenerator(15)
      puzzle = generator.generate(words, 12)
      
      if (puzzle && puzzle.quality.score >= 50) {
        console.log(`[${requestId}] Generated puzzle: ${puzzle.clues.across.length + puzzle.clues.down.length} words, quality ${puzzle.quality.score}`)
        break
      }
      puzzle = null
    }

    if (!puzzle) throw new Error('Failed to generate quality puzzle after 5 attempts')

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })
    
    const { data: existing } = await supabase
      .from('crosswords')
      .select('id')
      .eq('type', 'daily')
      .eq('publish_date', today)
      .maybeSingle()

    if (existing) {
      console.log(`[${requestId}] Puzzle already exists for ${today}`)
      return new Response(
        JSON.stringify({ 
          message: 'Crossword already exists for today',
          puzzle_id: existing.id,
          date: today
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { data: inserted, error: insertError } = await supabase
      .from('crosswords')
      .insert({
        type: 'daily',
        grid_data: puzzle.grid,
        clues: puzzle.clues,
        solutions: {},
        quality_score: puzzle.quality.score,
        publish_date: today
      })
      .select('id')
      .single()

    if (insertError) throw new Error(`Failed to insert: ${insertError.message}`)

    const totalTime = Date.now() - startTime
    const wordCount = puzzle.clues.across.length + puzzle.clues.down.length

    console.log(`[${requestId}] SUCCESS in ${totalTime}ms: ${wordCount} words, quality ${puzzle.quality.score}`)

    return new Response(
      JSON.stringify({
        success: true,
        puzzle_id: inserted.id,
        date: today,
        words_count: wordCount,
        quality_score: puzzle.quality.score,
        total_time_ms: totalTime,
        attempts
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    const error = err as Error
    const totalTime = Date.now() - startTime
    
    console.error(`[${requestId}] ERROR after ${totalTime}ms:`, error.message)
    console.error(`[${requestId}] Stack:`, error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        request_id: requestId,
        elapsed_ms: totalTime
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
