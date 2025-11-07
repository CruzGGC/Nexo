import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * GET /api/puzzle/daily
 * Returns today's daily crossword puzzle
 * All players get the same puzzle for the day
 */
export async function GET() {
  try {
    // Get today's date in Portugal timezone
    const today = new Date();
    const portugalDate = new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Europe/Lisbon',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    const [day, month, year] = portugalDate.split('/');
    const publishDate = `${year}-${month}-${day}`;

    // Fetch today's daily puzzle
    const { data: puzzle, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('type', 'daily')
      .eq('publish_date', publishDate)
      .single();

    if (error) {
      // If no puzzle for today, try to get the most recent one
      console.warn('No puzzle for today, fetching most recent:', error);
      
      const { data: recentPuzzle, error: recentError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('type', 'daily')
        .order('publish_date', { ascending: false })
        .limit(1)
        .single();

      if (recentError) {
        console.error('Erro ao buscar puzzle diário:', recentError);
        return NextResponse.json(
          { 
            error: 'Nenhum puzzle diário disponível',
            message: 'O puzzle diário será gerado à meia-noite. Por favor, tente novamente mais tarde.',
          },
          { status: 404 }
        );
      }

      if (!recentPuzzle) {
        return NextResponse.json(
          { 
            error: 'Nenhum puzzle diário disponível',
            message: 'Por favor, tente novamente mais tarde.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        Object.assign({}, recentPuzzle, {
          isFromPreviousDay: true,
          message: 'Puzzle de um dia anterior (novo puzzle à meia-noite)',
        })
      );
    }

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
