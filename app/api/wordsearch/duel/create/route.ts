import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { WordSearchGenerator } from '@/lib/wordsearch-generator'
import type { Json } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createServiceSupabaseClient()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Check if puzzle already exists
    const { data: existing } = await supabase
      .from('wordsearches')
      .select('id')
      .eq('id', id)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Puzzle already exists', id })
    }

    // Fetch words
    const { data: allWords, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .gte('word', 'aaa')
      .limit(1000)

    if (wordsError || !allWords) {
      throw new Error('Failed to fetch dictionary')
    }

    // Filter and shuffle
    const validWords = allWords
      .filter(w => w.word.length >= 6 && w.word.length <= 10)
      .sort(() => Math.random() - 0.5)
      .slice(0, 100)

    // Generate
    const generator = new WordSearchGenerator(15)
    let puzzle = null
    let attempts = 0
    
    while (!puzzle && attempts < 5) {
      const result = generator.generate(validWords, 10)
      if (result.words.length >= 6) {
        puzzle = result
      }
      attempts++
    }

    if (!puzzle) {
      return NextResponse.json({ error: 'Failed to generate puzzle' }, { status: 500 })
    }

    // Save
    const { error: insertError } = await supabase
      .from('wordsearches')
      .insert({
        id,
        type: 'random',
        grid_data: puzzle.grid as unknown as Json,
        words: puzzle.words as unknown as Json,
        size: 15,
        publish_date: null
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save puzzle' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error creating duel puzzle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
