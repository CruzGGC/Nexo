'use server'

import 'server-only'
import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/lib/types/games'

interface CategoryRow {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

interface DictionaryCategoryRow {
  category_id: string | null
}

function mapCategory(row: CategoryRow, count: number): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    icon: row.icon ?? '🎲',
    color: row.color ?? '#f4f4f5',
    word_count: count,
  }
}

async function fetchCategoriesInternal(): Promise<Category[]> {
  const { data: categories, error } = await supabase
    .from('word_categories')
    .select('*')
    .order('slug', { ascending: true })

  if (error || !categories) {
    throw new Error(error?.message ?? 'Erro ao carregar categorias')
  }

  const { data: dictionaryRows, error: dictionaryError } = await supabase
    .from('dictionary_categories')
    .select('category_id')

  if (dictionaryError || !dictionaryRows) {
    throw new Error(dictionaryError?.message ?? 'Erro ao carregar contagem de palavras')
  }

  const counts = buildCountMap(dictionaryRows as DictionaryCategoryRow[])
  return (categories as CategoryRow[]).map((category) =>
    mapCategory(category, counts[category.id] ?? 0)
  )
}

function buildCountMap(rows: DictionaryCategoryRow[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.category_id) return acc
    acc[row.category_id] = (acc[row.category_id] ?? 0) + 1
    return acc
  }, {})
}

export async function fetchCategoriesWithCounts(): Promise<Category[]> {
  return fetchCategoriesInternal()
}

export const getCachedCategories = cache(fetchCategoriesInternal)
