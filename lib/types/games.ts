import type { CrosswordCell, CrosswordClue } from '@/lib/types/crossword'
import type { WordPlacement } from '@/lib/wordsearch-generator'

export type GameMode = 'daily' | 'random'

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  word_count: number
}

export interface CrosswordPuzzle {
  id: string
  type: GameMode
  category?: string | null
  grid_data: CrosswordCell[][]
  clues: {
    across: CrosswordClue[]
    down: CrosswordClue[]
  }
  solutions?: Record<string, unknown>
  quality?: {
    intersections: number
    density: number
    score: number
  }
  publish_date: string | null
  created_at?: string | null
  isFromPreviousDay?: boolean
}

export interface WordSearchGridCell {
  letter: string
  row: number
  col: number
}

export interface WordSearchPuzzle {
  id: string
  type: GameMode
  category?: string | null
  grid_data: WordSearchGridCell[][] | string[][]
  words: WordPlacement[]
  size?: number
  publish_date: string | null
  created_at?: string | null
  isFromPreviousDay?: boolean
}

export interface ApiErrorPayload {
  error?: string
  message?: string
}
