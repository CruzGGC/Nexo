'use client'

/**
 * useMatchmaking - Main orchestration hook for matchmaking
 * 
 * This hook composes the three smaller hooks:
 * - useMatchmakingPresence: Lobby presence and stats
 * - useMatchmakingQueue: Queue subscription and polling
 * - useMatchmakingRoom: Room subscription and state
 * 
 * Refactored from 686 lines to ~200 lines
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'
import { MATCHMAKING } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type {
  SupportedMatchGame,
  QueueStatus,
  JoinOptions,
  LobbyStats,
  MatchmakingQueueRow,
  GameRoomRow,
  MatchmakingJoinResult,
  Json
} from '@/lib/matchmaking/types'
import {
  deriveRating,
  deriveSkillBracket,
  normalizeRegion,
  extractErrorMessage,
  isAbortError,
  generatePresenceClientId
} from '@/lib/matchmaking/utils'
import { useMatchmakingPresence } from './useMatchmakingPresence'
import { useMatchmakingQueue } from './useMatchmakingQueue'
import { useMatchmakingRoom } from './useMatchmakingRoom'

// Re-export types for backwards compatibility
export type { QueueStatus, LobbyStats }

interface UseMatchmakingReturn {
  status: QueueStatus
  queueEntry: MatchmakingQueueRow | null
  room: GameRoomRow | null
  error: string | null
  lobbyStats: LobbyStats
  joinQueue: (options: JoinOptions) => Promise<MatchmakingQueueRow>
  leaveQueue: () => Promise<void>
  updateRoomState: (updater: (current: Json | null) => Json) => Promise<void>
  resetMatch: () => Promise<void>
}

export function useMatchmaking(gameType: SupportedMatchGame): UseMatchmakingReturn {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const { user, profile, signInAsGuest } = useAuth()
  
  const [status, setStatus] = useState<QueueStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState<'public' | 'private'>('public')
  
  const rpcAbortControllerRef = useRef<AbortController | null>(null)
  const presenceClientId = useRef(generatePresenceClientId()).current

  const logDebug = useCallback((...args: unknown[]) => {
    if (logger.env.isDevelopment) {
      console.debug(`[matchmaking:${gameType}]`, ...args)
    }
  }, [gameType])

  // Room hook
  const roomHook = useMatchmakingRoom()

  // Queue hook with callbacks
  const queueHook = useMatchmakingQueue({
    onQueueUpdate: useCallback((entry: MatchmakingQueueRow | null) => {
      if (!entry) {
        setStatus('idle')
      }
    }, []),
    onMatchedWithRoom: useCallback((roomId: string) => {
      logDebug('matched with room, fetching', roomId)
      void roomHook.fetchRoom(roomId)
      setStatus('matched')
    }, [logDebug, roomHook])
  })

  // Presence hook synced with queue state
  const presenceHook = useMatchmakingPresence({
    gameType,
    queueEntryId: queueHook.queueEntry?.id,
    status,
    mode: currentMode
  })

  // Cleanup queue entry on unmount
  useEffect(() => {
    return () => {
      if (queueHook.queueEntry?.id) {
        logDebug('unmount: removing queued entry')
        void supabase
          .from('matchmaking_queue')
          .delete()
          .eq('id', queueHook.queueEntry.id)
      }
    }
  }, [logDebug, queueHook.queueEntry?.id, supabase])

  // Cleanup RPC abort controller on unmount
  useEffect(() => {
    return () => {
      if (rpcAbortControllerRef.current) {
        rpcAbortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Join the matchmaking queue
   */
  const joinQueue = useCallback(async (options: JoinOptions): Promise<MatchmakingQueueRow> => {
    logDebug('joinQueue: start', options)
    
    try {
      setError(null)
      setCurrentMode(options.mode)
      
      // Ensure user is authenticated
      if (!user) {
        logDebug('joinQueue: no user, signing in as guest')
        await signInAsGuest()
      }

      const currentUser = user ?? (await supabase.auth.getUser()).data.user
      if (!currentUser) {
        throw new Error('É necessário iniciar sessão para entrar na fila.')
      }
      logDebug('joinQueue: user ready', currentUser.id)

      setStatus('joining')
      presenceHook.syncPresence({ status: 'joining', mode: options.mode })

      // Prepare RPC parameters
      const rating = options.ratingSnapshot ?? deriveRating(profile)
      const skillBracket = options.skillBracket ?? deriveSkillBracket(rating)
      const region = options.regionOverride ?? normalizeRegion(profile?.country_code)
      const matchCode = options.matchCode?.toUpperCase()
      const metadata: Record<string, unknown> = {
        ...options.metadata,
        mode: options.mode,
        matchCode,
        presence_key: presenceClientId
      }
      if (options.seat) {
        metadata.seat = options.seat
      }

      logDebug('joinQueue: rpc input', { rating, skillBracket, region, metadata })

      // Setup abort controller for timeout
      if (rpcAbortControllerRef.current) {
        rpcAbortControllerRef.current.abort()
      }
      const abortController = new AbortController()
      rpcAbortControllerRef.current = abortController
      
      const timeoutId = setTimeout(() => {
        if (!abortController.signal.aborted) {
          logDebug('joinQueue: rpc timeout')
          abortController.abort()
        }
      }, MATCHMAKING.RPC_TIMEOUT_MS)

      let payload: MatchmakingJoinResult | null = null
      
      try {
        const { data, error: rpcError } = await supabase.rpc('matchmaking_join_and_create_room', {
          p_user_id: currentUser.id,
          p_game_type: gameType,
          p_rating_snapshot: rating,
          p_skill_bracket: skillBracket,
          p_region: region,
          p_metadata: metadata as Json
        })

        if (rpcError || !data) {
          logDebug('joinQueue: rpc error', rpcError)
          throw rpcError ?? new Error('Resposta inválida do emparelhamento')
        }

        payload = data as unknown as MatchmakingJoinResult
      } catch (rpcErr) {
        if (isAbortError(rpcErr)) {
          throw new Error('Tempo limite ao contactar o emparelhamento. Tenta novamente em instantes.')
        }
        throw rpcErr
      } finally {
        clearTimeout(timeoutId)
        if (rpcAbortControllerRef.current === abortController) {
          rpcAbortControllerRef.current = null
        }
      }

      if (!payload) {
        throw new Error('Resposta inválida do emparelhamento')
      }

      logDebug('joinQueue: rpc response', payload)

      // Update state with queue entry
      const queuePayload = payload.queue_entry as MatchmakingQueueRow
      queueHook.setQueueEntry(queuePayload)
      queueHook.subscribeToQueue(queuePayload.id)

      // Handle immediate match
      if (payload.room) {
        logDebug('joinQueue: immediate match', payload.room)
        roomHook.setRoom(payload.room as GameRoomRow)
        roomHook.subscribeToRoom(payload.room.id)
        setStatus('matched')
        presenceHook.syncPresence({ status: 'matched', queue_entry_id: queuePayload.id })
        return queuePayload
      }

      // Set queued status
      const nextStatus = payload.status === 'matched' ? 'matched' : 'queued'
      setStatus(nextStatus)
      presenceHook.syncPresence({ status: nextStatus, queue_entry_id: queuePayload.id })
      
      return queuePayload
    } catch (err) {
      const message = extractErrorMessage(err, 'Falha ao entrar na fila')
      logDebug('joinQueue: error', message, err)
      setError(message)
      setStatus('error')
      presenceHook.syncPresence({ status: 'error', queue_entry_id: null })
      throw new Error(message)
    }
  }, [gameType, logDebug, presenceClientId, presenceHook, profile, queueHook, roomHook, signInAsGuest, supabase, user])

  /**
   * Leave the matchmaking queue
   */
  const leaveQueue = useCallback(async () => {
    if (!queueHook.queueEntry) return
    
    try {
      logDebug('leaveQueue: start', queueHook.queueEntry.id)
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('id', queueHook.queueEntry.id)
      
      queueHook.setQueueEntry(null)
      roomHook.setRoom(null)
      setStatus('idle')
      queueHook.cleanup()
      roomHook.cleanup()
      presenceHook.syncPresence({ status: 'idle', queue_entry_id: null })
    } catch (err) {
      logger.error('Falha ao sair da fila', err)
    }
  }, [logDebug, presenceHook, queueHook, roomHook, supabase])

  /**
   * Reset match state
   */
  const resetMatch = useCallback(async () => {
    logDebug('resetMatch: clearing state')
    
    // Delete queue entry if exists
    if (queueHook.queueEntry?.id) {
      try {
        await supabase
          .from('matchmaking_queue')
          .delete()
          .eq('id', queueHook.queueEntry.id)
        logDebug('resetMatch: deleted queue entry')
      } catch (err) {
        logDebug('resetMatch: failed to delete queue entry', err)
      }
    }
    
    roomHook.setRoom(null)
    queueHook.setQueueEntry(null)
    setStatus('idle')
    queueHook.cleanup()
    roomHook.cleanup()
    presenceHook.syncPresence({ status: 'idle', queue_entry_id: null })
  }, [logDebug, presenceHook, queueHook, roomHook, supabase])

  return {
    status,
    queueEntry: queueHook.queueEntry,
    room: roomHook.room,
    error: error ?? roomHook.roomError,
    lobbyStats: presenceHook.lobbyStats,
    joinQueue,
    leaveQueue,
    updateRoomState: roomHook.updateRoomState,
    resetMatch
  }
}
