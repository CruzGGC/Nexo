'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth'
import { TIMING } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type {
  SupportedMatchGame,
  LobbyStats,
  LobbyPresenceMeta,
  QueueStatus,
  JoinMode
} from '@/lib/matchmaking/types'
import {
  generatePresenceClientId,
  buildPresencePayload,
  computeLobbyStats
} from '@/lib/matchmaking/utils'

interface UseMatchmakingPresenceOptions {
  gameType: SupportedMatchGame
  /** External queue entry ID to include in presence */
  queueEntryId?: string | null
  /** External status to include in presence */
  status?: QueueStatus
  /** Join mode (public/private) */
  mode?: JoinMode
}

interface UseMatchmakingPresenceReturn {
  /** Current lobby statistics */
  lobbyStats: LobbyStats
  /** Whether lobby channel is connected */
  isConnected: boolean
  /** Sync presence with optional overrides */
  syncPresence: (overrides?: Partial<LobbyPresenceMeta>) => void
  /** Current presence client ID */
  presenceClientId: string
}

/**
 * Hook for managing matchmaking presence in the lobby
 * 
 * Handles:
 * - Lobby channel subscription
 * - Presence tracking and sync
 * - Lobby statistics computation
 * - Auto-reconnection on channel errors
 */
export function useMatchmakingPresence(
  options: UseMatchmakingPresenceOptions
): UseMatchmakingPresenceReturn {
  const { gameType, queueEntryId, status = 'idle', mode = 'public' } = options
  
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const { user, profile } = useAuth()
  
  const [lobbyStats, setLobbyStats] = useState<LobbyStats>({ total: 0, regions: {}, brackets: {} })
  const [isConnected, setIsConnected] = useState(false)
  
  // Generate client ID once and store as state (stable across renders)
  const [presenceClientId] = useState(() => generatePresenceClientId())
  
  const lobbyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const presenceClientIdRef = useRef<string>(presenceClientId)
  const lastPayloadRef = useRef<LobbyPresenceMeta | null>(null)
  const pendingPayloadRef = useRef<Partial<LobbyPresenceMeta> | null>(null)
  
  // Keep track of latest values in refs for callbacks
  const statusRef = useRef(status)
  const queueEntryIdRef = useRef(queueEntryId)
  const modeRef = useRef(mode)
  
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { queueEntryIdRef.current = queueEntryId }, [queueEntryId])
  useEffect(() => { modeRef.current = mode }, [mode])

  const logDebug = useCallback((...args: unknown[]) => {
    if (logger.env.isDevelopment) {
      console.debug(`[presence:${gameType}]`, ...args)
    }
  }, [gameType])

  /**
   * Sync presence to the lobby channel
   */
  const syncPresence = useCallback((overrides?: Partial<LobbyPresenceMeta>) => {
    logDebug('syncPresence: requested', overrides)
    
    const channel = lobbyChannelRef.current
    const mergedOverrides = overrides || pendingPayloadRef.current
      ? { ...(pendingPayloadRef.current ?? {}), ...(overrides ?? {}) }
      : undefined

    // If channel not ready, cache the payload
    if (!channel || channel.state !== 'joined') {
      logDebug('syncPresence: channel not ready, caching payload')
      pendingPayloadRef.current = mergedOverrides ?? pendingPayloadRef.current
      return
    }

    const payload = buildPresencePayload({
      presenceClientId: presenceClientIdRef.current,
      userId: user?.id ?? null,
      gameType,
      profile,
      status: mergedOverrides?.status ?? statusRef.current,
      queueEntryId: mergedOverrides?.queue_entry_id ?? queueEntryIdRef.current ?? null,
      mode: mergedOverrides?.mode ?? modeRef.current,
      overrides: mergedOverrides
    })

    pendingPayloadRef.current = null
    lastPayloadRef.current = payload

    void channel.track(payload).then(() => {
      logDebug('syncPresence: track ok', payload)
    }).catch(err => {
      logger.error('Falha ao sincronizar presença do lobby', err)
    })
  }, [gameType, logDebug, profile, user?.id])

  // Store latest syncPresence in ref for channel callback
  const syncPresenceRef = useRef(syncPresence)
  useEffect(() => { syncPresenceRef.current = syncPresence }, [syncPresence])

  // Ref to store setupLobbyChannel for recursive retry
  const setupLobbyChannelRef = useRef<() => ReturnType<typeof supabase.channel>>(null!)

  /**
   * Setup lobby channel with presence
   */
  const setupLobbyChannel = useCallback(() => {
    const channel = supabase
      .channel(`matchmaking:lobby:${gameType}`, {
        config: {
          presence: { key: presenceClientIdRef.current }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<LobbyPresenceMeta>()
        logDebug('lobby presence sync', state)
        setLobbyStats(computeLobbyStats(state))
      })

    lobbyChannelRef.current = channel

    channel.subscribe(channelStatus => {
      logDebug('lobby channel status', channelStatus)
      
      if (channelStatus === 'SUBSCRIBED') {
        setIsConnected(true)
        // Sync any pending presence
        syncPresenceRef.current?.()
        return
      }

      if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
        setIsConnected(false)
        logDebug('lobby channel degraded, scheduling retry')
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null
          if (lobbyChannelRef.current === channel) {
            logDebug('lobby channel retrying subscribe')
            void channel.untrack()
            supabase.removeChannel(channel)
            lobbyChannelRef.current = null
            // Use ref to avoid accessing setupLobbyChannel before it's assigned
            setupLobbyChannelRef.current()
          }
        }, TIMING.REALTIME_RETRY_DELAY_MS)
      }
    })

    return channel
  }, [gameType, logDebug, supabase])

  // Keep ref updated with latest setupLobbyChannel (inside effect to avoid render-time ref write)
  useEffect(() => {
    setupLobbyChannelRef.current = setupLobbyChannel
  }, [setupLobbyChannel])

  // Setup channel on mount
  useEffect(() => {
    const channel = setupLobbyChannel()
    
    return () => {
      logDebug('lobby channel cleanup')
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      setIsConnected(false)
      void channel.untrack()
      supabase.removeChannel(channel)
      if (lobbyChannelRef.current === channel) {
        lobbyChannelRef.current = null
      }
    }
  }, [logDebug, setupLobbyChannel, supabase])

  // Auto-sync presence when external props change
  useEffect(() => {
    if (isConnected) {
      syncPresence()
    }
  }, [isConnected, status, queueEntryId, mode, syncPresence])

  return {
    lobbyStats,
    isConnected,
    syncPresence,
    presenceClientId
  }
}
