/**
 * Matchmaking Utilities
 * 
 * Funções puras para cálculos de matchmaking
 */

import type { Profile } from '@/components/auth'
import type { LobbyStats, LobbyPresenceMeta, PresenceState, QueueStatus, SupportedMatchGame } from './types'
import { MATCHMAKING } from '@/lib/constants'

// ============================================================================
// Rating & Skill Brackets
// ============================================================================

const SKILL_BRACKETS = [
  { name: 'bronze', max: 1100 },
  { name: 'prata', max: 1400 },
  { name: 'ouro', max: 1600 },
  { name: 'platina', max: 1900 },
  { name: 'diamante', max: Number.POSITIVE_INFINITY }
] as const

/**
 * Derive player rating from profile
 * Returns a rating between 800-2200 based on experience points
 */
export function deriveRating(profile?: Profile | null): number {
  if (!profile) return MATCHMAKING.DEFAULT_RATING
  if (typeof profile.experience_points === 'number') {
    return Math.max(800, Math.min(2200, 1000 + profile.experience_points))
  }
  return MATCHMAKING.DEFAULT_RATING
}

/**
 * Derive skill bracket from rating
 */
export function deriveSkillBracket(rating: number): string {
  const entry = SKILL_BRACKETS.find(item => rating < item.max)
  return entry?.name ?? 'bronze'
}

/**
 * Normalize region/country code
 */
export function normalizeRegion(countryCode?: string | null): string {
  if (!countryCode) return 'global'
  return countryCode.toLowerCase()
}

/**
 * Generate random match code for private games
 */
export function generateMatchCode(length: number = MATCHMAKING.PRIVATE_CODE_LENGTH): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let value = ''
  for (let i = 0; i < length; i++) {
    value += chars[Math.floor(Math.random() * chars.length)]
  }
  return value
}

// ============================================================================
// Presence Utilities
// ============================================================================

/**
 * Generate a unique presence client ID
 */
export function generatePresenceClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `presence-${Math.random().toString(36).slice(2)}`
}

/**
 * Build presence payload for realtime channel
 */
export function buildPresencePayload(params: {
  presenceClientId: string
  userId: string | null
  gameType: SupportedMatchGame
  profile?: Profile | null
  status: QueueStatus
  queueEntryId: string | null
  mode?: 'public' | 'private'
  overrides?: Partial<LobbyPresenceMeta>
}): LobbyPresenceMeta {
  const { presenceClientId, userId, gameType, profile, status, queueEntryId, mode, overrides } = params
  const rating = deriveRating(profile)
  const skillBracket = deriveSkillBracket(rating)
  const region = normalizeRegion(profile?.country_code)

  return {
    presence_id: presenceClientId,
    user_id: userId,
    game_type: gameType,
    rating_snapshot: rating,
    skill_bracket: skillBracket,
    region,
    status: overrides?.status ?? status,
    queue_entry_id: overrides?.queue_entry_id ?? queueEntryId,
    mode: overrides?.mode ?? mode ?? 'public',
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Compute lobby statistics from presence state
 */
export function computeLobbyStats(state: PresenceState | null): LobbyStats {
  const summary: LobbyStats = { total: 0, regions: {}, brackets: {} }
  
  if (!state) return summary

  Object.values(state).forEach(presenceEntries => {
    presenceEntries?.forEach(entry => {
      summary.total += 1
      const regionKey = (entry.region || 'global').toLowerCase()
      const bracketKey = (entry.skill_bracket || 'bronze').toLowerCase()
      summary.regions[regionKey] = (summary.regions[regionKey] ?? 0) + 1
      summary.brackets[bracketKey] = (summary.brackets[bracketKey] ?? 0) + 1
    })
  })

  return summary
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(err: unknown, fallback: string = 'Erro desconhecido'): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as Record<string, unknown>
    if (typeof errorObj.message === 'string') return errorObj.message
    if (typeof errorObj.error === 'string') return errorObj.error
    if (typeof errorObj.details === 'string') return errorObj.details
  }
  return fallback
}

/**
 * Check if error is an abort error
 */
export function isAbortError(err: unknown): boolean {
  return (err as DOMException)?.name === 'AbortError'
}
