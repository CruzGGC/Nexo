/**
 * Matchmaking Types
 * 
 * Tipos centralizados para o sistema de matchmaking
 */

import type { RealtimePresenceState } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'

// Database row types
export type MatchmakingQueueRow = Database['public']['Tables']['matchmaking_queue']['Row']
export type GameRoomRow = Database['public']['Tables']['game_rooms']['Row']

// Game types supported
export type SupportedMatchGame = 'battleship' | 'tic_tac_toe' | 'crossword_duel' | 'wordsearch_duel'

// Queue status states
export type QueueStatus = 'idle' | 'joining' | 'queued' | 'matched' | 'error'

// Join modes
export type JoinMode = 'public' | 'private'

// Join options
export interface JoinOptions {
  mode: JoinMode
  matchCode?: string
  seat?: 'host' | 'guest'
  metadata?: Record<string, unknown>
  ratingSnapshot?: number
  skillBracket?: string
  regionOverride?: string
}

// Lobby statistics
export interface LobbyStats {
  total: number
  regions: Record<string, number>
  brackets: Record<string, number>
}

// Presence metadata sent to realtime channel
export interface LobbyPresenceMeta {
  presence_id: string
  user_id: string | null
  game_type: SupportedMatchGame
  rating_snapshot: number
  skill_bracket: string
  region: string
  status: QueueStatus
  queue_entry_id: string | null
  mode?: JoinMode
  updated_at: string
}

// RPC result from matchmaking_join_and_create_room
export interface MatchmakingJoinResult {
  status: 'queued' | 'matched'
  queue_entry: MatchmakingQueueRow
  opponent_entry?: MatchmakingQueueRow | null
  room?: GameRoomRow | null
}

// Presence state type from Supabase
export type PresenceState = RealtimePresenceState<LobbyPresenceMeta>

// Re-export for convenience
export type { Json }
