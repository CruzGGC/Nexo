/**
 * Matchmaking Module
 * 
 * Re-exports all matchmaking utilities and types
 */

// Types
export type {
  MatchmakingQueueRow,
  GameRoomRow,
  SupportedMatchGame,
  QueueStatus,
  JoinMode,
  JoinOptions,
  LobbyStats,
  LobbyPresenceMeta,
  MatchmakingJoinResult,
  PresenceState,
  Json
} from './types'

// Utilities
export {
  deriveRating,
  deriveSkillBracket,
  normalizeRegion,
  generateMatchCode,
  generatePresenceClientId,
  buildPresencePayload,
  computeLobbyStats,
  extractErrorMessage,
  isAbortError
} from './utils'
