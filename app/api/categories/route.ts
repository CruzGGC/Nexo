import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * GET /api/categories
 * Returns list of all available word categories with metadata
 * Used for category selection UI in games
 */
export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('word_categories')
      .select('*')
      .order('slug', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      )
    }

    // Count words per category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category: any) => {
        const { count } = await supabase
          .from('dictionary_categories')
          .select('word', { count: 'exact', head: true })
          .eq('category_id', category.id)

        return {
          ...category,
          word_count: count || 0
        }
      })
    )

    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error('Erro ao processar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
