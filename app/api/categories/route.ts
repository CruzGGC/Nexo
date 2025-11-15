import { NextResponse } from 'next/server'
import { fetchCategoriesWithCounts } from '@/lib/data/categories'

export const revalidate = 1800

/**
 * GET /api/categories
 * Returns list of all available word categories with metadata
 * Used for category selection UI in games
 */
export async function GET() {
  try {
    const categories = await fetchCategoriesWithCounts()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao processar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
