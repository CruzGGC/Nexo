import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, puzzle_id, time_ms } = body;

    // Validação básica
    if (!user_id || !puzzle_id || !time_ms) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    if (time_ms <= 0) {
      return NextResponse.json(
        { error: 'Tempo inválido' },
        { status: 400 }
      );
    }

    // Insere a pontuação
    const { data, error } = await (supabase as any)
      .from('scores')
      .insert({
        user_id,
        puzzle_id: parseInt(puzzle_id),
        time_ms: parseInt(time_ms),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao guardar pontuação:', error);
      return NextResponse.json(
        { error: 'Erro ao guardar pontuação' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Buscar as melhores pontuações para um puzzle
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puzzle_id = searchParams.get('puzzle_id');

    if (!puzzle_id) {
      return NextResponse.json(
        { error: 'ID do puzzle é obrigatório' },
        { status: 400 }
      );
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
      .order('time_ms', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar pontuações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar pontuações' },
        { status: 500 }
      );
    }

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
