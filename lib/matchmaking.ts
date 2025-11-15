import type { Profile } from '@/components/AuthProvider'

const BRACKETS = [
  { name: 'bronze', max: 1100 },
  { name: 'prata', max: 1400 },
  { name: 'ouro', max: 1600 },
  { name: 'platina', max: 1900 },
  { name: 'diamante', max: Number.POSITIVE_INFINITY }
] as const

export type SupportedMatchGame = 'battleship' | 'tic_tac_toe' | 'crossword_duel' | 'wordsearch_duel'

export function deriveRating(profile?: Profile | null) {
  if (!profile) return 1200
  if (typeof profile.experience_points === 'number') {
    return Math.max(800, Math.min(2200, 1000 + profile.experience_points))
  }
  return 1200
}

export function deriveSkillBracket(rating: number) {
  const entry = BRACKETS.find(item => rating < item.max)
  return entry?.name ?? 'bronze'
}

export function normalizeRegion(countryCode?: string | null) {
  if (!countryCode) return 'global'
  return countryCode.toLowerCase()
}

export function generateMatchCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let value = ''
  for (let i = 0; i < length; i++) {
    value += chars[Math.floor(Math.random() * chars.length)]
  }
  return value
}
