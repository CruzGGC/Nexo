import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { CrosswordGenerator } from '@/lib/crossword-generator';

/**
 * GET /api/puzzle/random
 * Generates a new random crossword puzzle on each request
 * Uses words from dictionary_pt to create unique puzzles
 * These puzzles are NOT saved to the database
 */
export async function GET() {
  try {
    // Fetch random words from dictionary (more than needed for flexibility)
    const { data: words, error: wordsError } = await supabase
      .from('dictionary_pt')
      .select('word, definition')
      .not('definition', 'is', null);

    if (wordsError) {
      console.error('Erro ao buscar palavras:', wordsError);
      return NextResponse.json(
        { error: 'Erro ao buscar palavras do dicionário' },
        { status: 500 }
      );
    }

    if (!words || words.length === 0) {
      return NextResponse.json(
        { 
          error: 'Dicionário vazio',
          message: 'Por favor, popule a tabela dictionary_pt primeiro.',
        },
        { status: 404 }
      );
    }

    // Shuffle words for randomness
    const shuffledWords = words
      .sort(() => Math.random() - 0.5)
      .slice(0, 100); // Use 100 random words

    console.log(`🎲 Generating random puzzle with ${shuffledWords.length} words`);

    // Generate crossword (try up to 5 times for a good puzzle)
    let puzzle = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!puzzle && attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${maxAttempts}`);
      
      const generator = new CrosswordGenerator(15);
      puzzle = generator.generate(shuffledWords, 12);
    }

    if (!puzzle) {
      console.error('❌ Failed to generate puzzle after multiple attempts');
      return NextResponse.json(
        { 
          error: 'Erro ao gerar puzzle',
          message: 'Não foi possível gerar um puzzle válido. Por favor, tente novamente.',
        },
        { status: 500 }
      );
    }

    console.log('✅ Random puzzle generated successfully');

    // Return puzzle with metadata
    return NextResponse.json({
      id: null, // No ID because it's not saved
      type: 'random',
      grid_data: puzzle.grid,
      clues: puzzle.clues,
      solutions: {},
      publish_date: null,
      created_at: new Date().toISOString(),
      isRandom: true, // Flag to indicate this is a random puzzle
      wordsCount: puzzle.clues.across.length + puzzle.clues.down.length,
    });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
