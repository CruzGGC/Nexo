'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimePresenceState } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'
import { deriveRating, deriveSkillBracket, normalizeRegion, type SupportedMatchGame } from '@/lib/matchmaking'

type MatchmakingQueueRow = Database['public']['Tables']['matchmaking_queue']['Row']
type GameRoomRow = Database['public']['Tables']['game_rooms']['Row']

export type QueueStatus = 'idle' | 'joining' | 'queued' | 'matched' | 'error'

type JoinMode = 'public' | 'private'

type JoinOptions = {
  mode: JoinMode
  matchCode?: string
  seat?: 'host' | 'guest'
  metadata?: Record<string, unknown>
  ratingSnapshot?: number
  skillBracket?: string
  regionOverride?: string
}

export type LobbyStats = {
  total: number
  regions: Record<string, number>
  brackets: Record<string, number>
}

type LobbyPresenceMeta = {
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

const MATCHMAKING_RPC_TIMEOUT_MS = 10000

export function useMatchmaking(gameType: SupportedMatchGame) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const { user, profile, signInAsGuest } = useAuth()
  const [status, setStatus] = useState<QueueStatus>('idle')
  const [queueEntry, setQueueEntry] = useState<MatchmakingQueueRow | null>(null)
  const [room, setRoom] = useState<GameRoomRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lobbyStats, setLobbyStats] = useState<LobbyStats>({ total: 0, regions: {}, brackets: {} })
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const queueChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lobbyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const queueRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lobbyRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rpcAbortControllerRef = useRef<AbortController | null>(null)
  const queuePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const queuePollEntryIdRef = useRef<string | null>(null)
  const queueEntryRef = useRef<MatchmakingQueueRow | null>(null)
  const statusRef = useRef<QueueStatus>('idle')
  const presenceClientIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `presence-${Math.random().toString(36).slice(2)}`
  )
  const lastPresencePayloadRef = useRef<LobbyPresenceMeta | null>(null)
  const pendingPresenceRef = useRef<Partial<LobbyPresenceMeta> | null>(null)
  const syncPresenceLatestRef = useRef<(overrides?: Partial<LobbyPresenceMeta>) => void>(() => {})
  const logDebug = useCallback((...args: unknown[]) => {
    console.debug(`[matchmaking:${gameType}]`, ...args)
  }, [gameType])

  const stopQueuePolling = useCallback(() => {
    if (queuePollIntervalRef.current) {
      clearInterval(queuePollIntervalRef.current)
      queuePollIntervalRef.current = null
    }
    queuePollEntryIdRef.current = null
  }, [])

  const cleanupChannels = useCallback(() => {
    if (queueRetryTimeoutRef.current) {
      clearTimeout(queueRetryTimeoutRef.current)
      queueRetryTimeoutRef.current = null
    }
    if (lobbyRetryTimeoutRef.current) {
      clearTimeout(lobbyRetryTimeoutRef.current)
      lobbyRetryTimeoutRef.current = null
    }
    stopQueuePolling()
    if (queueChannelRef.current) {
      logDebug('cleanupChannels: removing queue channel', queueChannelRef.current.topic)
      void queueChannelRef.current.unsubscribe()
      supabase.removeChannel(queueChannelRef.current)
      queueChannelRef.current = null
    }
    if (roomChannelRef.current) {
      logDebug('cleanupChannels: removing room channel', roomChannelRef.current.topic)
      void roomChannelRef.current.unsubscribe()
      supabase.removeChannel(roomChannelRef.current)
      roomChannelRef.current = null
    }
  }, [logDebug, stopQueuePolling, supabase])

  useEffect(() => cleanupChannels, [cleanupChannels])

  useEffect(() => {
    return () => {
      if (rpcAbortControllerRef.current) {
        rpcAbortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    queueEntryRef.current = queueEntry
  }, [queueEntry])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  const fetchQueueEntryById = useCallback(async (entryId: string) => {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('id', entryId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data as MatchmakingQueueRow | null
  }, [supabase])

  const computeLobbyStats = useCallback((state: RealtimePresenceState<LobbyPresenceMeta>): LobbyStats => {
    const summary: LobbyStats = { total: 0, regions: {}, brackets: {} }
    Object.values(state ?? {}).forEach(presenceEntries => {
      presenceEntries?.forEach(entry => {
        summary.total += 1
        const regionKey = (entry.region || 'global').toLowerCase()
        const bracketKey = (entry.skill_bracket || 'bronze').toLowerCase()
        summary.regions[regionKey] = (summary.regions[regionKey] ?? 0) + 1
        summary.brackets[bracketKey] = (summary.brackets[bracketKey] ?? 0) + 1
      })
    })
    logDebug('computeLobbyStats', summary)
    return summary
  }, [logDebug])

  const buildPresencePayload = useCallback(
    (overrides?: Partial<LobbyPresenceMeta>): LobbyPresenceMeta => {
      const rating = deriveRating(profile)
      const skillBracket = deriveSkillBracket(rating)
      const region = normalizeRegion(profile?.country_code)
      const payload: LobbyPresenceMeta = {
        presence_id: presenceClientIdRef.current,
        user_id: user?.id ?? null,
        game_type: gameType,
        rating_snapshot: rating,
        skill_bracket: skillBracket,
        region,
        status: overrides?.status ?? statusRef.current,
        queue_entry_id: overrides?.queue_entry_id ?? queueEntryRef.current?.id ?? null,
        mode: overrides?.mode ?? lastPresencePayloadRef.current?.mode ?? 'public',
        updated_at: new Date().toISOString()
      }
      logDebug('buildPresencePayload', payload)
      return payload
    },
    [gameType, logDebug, profile, user?.id]
  )

  const syncPresence = useCallback(
    (overrides?: Partial<LobbyPresenceMeta>) => {
      logDebug('syncPresence: requested', overrides)
      const channel = lobbyChannelRef.current
      const mergedOverrides =
        overrides || pendingPresenceRef.current
          ? { ...(pendingPresenceRef.current ?? {}), ...(overrides ?? {}) }
          : undefined

      if (!channel) {
        logDebug('syncPresence: channel missing, caching payload')
        pendingPresenceRef.current = mergedOverrides ?? pendingPresenceRef.current
        return
      }

      if (channel.state !== 'joined') {
        logDebug('syncPresence: channel not joined yet, caching payload', channel.state)
        pendingPresenceRef.current = mergedOverrides ?? pendingPresenceRef.current
        return
      }

      const payload = buildPresencePayload(mergedOverrides)
      pendingPresenceRef.current = null
      lastPresencePayloadRef.current = payload
      void channel
        .track(payload)
        .then(() => {
          logDebug('syncPresence: track ok', payload)
        })
        .catch(err => {
          console.error('Falha ao sincronizar presença do lobby', err)
          logDebug('syncPresence: track failed', err)
        })
    },
    [buildPresencePayload, logDebug]
  )

  useEffect(() => {
    syncPresenceLatestRef.current = syncPresence
  }, [syncPresence])

  const setupLobbyChannel = useCallback(() => {
    const channel = supabase
      .channel(`matchmaking:lobby:${gameType}`, {
        config: {
          presence: { key: presenceClientIdRef.current }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<LobbyPresenceMeta>()
        logDebug('lobby presence sync event', state)
        setLobbyStats(computeLobbyStats(state))
      })

    lobbyChannelRef.current = channel

    channel.subscribe(status => {
      logDebug('lobby channel status', status)
      if (status === 'SUBSCRIBED') {
        syncPresenceLatestRef.current?.()
        return
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logDebug('lobby channel degraded, scheduling retry', status)
        if (lobbyRetryTimeoutRef.current) {
          clearTimeout(lobbyRetryTimeoutRef.current)
        }
        lobbyRetryTimeoutRef.current = setTimeout(() => {
          lobbyRetryTimeoutRef.current = null
          if (lobbyChannelRef.current === channel) {
            logDebug('lobby channel retrying subscribe')
            void channel.untrack()
            supabase.removeChannel(channel)
            lobbyChannelRef.current = null
            setupLobbyChannel()
          }
        }, 1500)
      }
    })

    return channel
  }, [computeLobbyStats, gameType, logDebug, supabase])

  useEffect(() => {
    const channel = setupLobbyChannel()
    return () => {
      logDebug('lobby channel cleanup')
      if (lobbyRetryTimeoutRef.current) {
        clearTimeout(lobbyRetryTimeoutRef.current)
        lobbyRetryTimeoutRef.current = null
      }
      void channel.untrack()
      supabase.removeChannel(channel)
      if (lobbyChannelRef.current === channel) {
        lobbyChannelRef.current = null
      }
    }
  }, [logDebug, setupLobbyChannel, supabase])

  useEffect(() => {
    return () => {
      if (queueEntryRef.current) {
        logDebug('unmount: removing queued entry', queueEntryRef.current.id)
        void supabase
          .from('matchmaking_queue')
          .delete()
          .eq('id', queueEntryRef.current.id)
      }
    }
  }, [logDebug, supabase])

  const subscribeToRoom = useCallback((roomId: string) => {
    logDebug('subscribeToRoom: start', roomId)
    if (roomChannelRef.current) {
      logDebug('subscribeToRoom: replacing existing room channel')
      supabase.removeChannel(roomChannelRef.current)
      roomChannelRef.current = null
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        payload => {
          logDebug('room change payload', payload)
          setRoom(payload.new as GameRoomRow)
        }
      )
      .subscribe(status => {
        logDebug('room channel status', status)
      })

    roomChannelRef.current = channel
  }, [logDebug, supabase])

  const fetchRoom = useCallback(async (roomId: string) => {
    logDebug('fetchRoom: start', roomId)
    const { data, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) {
      console.error('Erro ao obter sala de jogo', roomError)
      logDebug('fetchRoom: error', roomError)
      setError(roomError.message)
      return
    }

    logDebug('fetchRoom: success', data)
    setRoom(data)
    subscribeToRoom(roomId)
  }, [logDebug, subscribeToRoom, supabase])

  const handleQueueUpdate = useCallback((entry: MatchmakingQueueRow | null) => {
    if (!entry) {
      logDebug('handleQueueUpdate: entry deleted')
      setQueueEntry(null)
      setStatus('idle')
      syncPresence({ status: 'idle', queue_entry_id: null })
      return
    }

    logDebug('handleQueueUpdate: entry data', entry)
    setQueueEntry(entry)

    if (entry.status === 'matched') {
      const meta = (entry.metadata ?? {}) as Record<string, unknown>
      const roomId = typeof meta.room_id === 'string' ? meta.room_id : null
      if (roomId) {
        logDebug('handleQueueUpdate: matched, fetching room', roomId)
        void fetchRoom(roomId)
      }
      setStatus('matched')
      syncPresence({ status: 'matched', queue_entry_id: entry.id })
    } else if (entry.status === 'queued') {
      syncPresence({ status: 'queued', queue_entry_id: entry.id })
    }
  }, [fetchRoom, logDebug, syncPresence])

  const pollQueueSnapshot = useCallback(async (entryId: string) => {
    try {
      const snapshot = await fetchQueueEntryById(entryId)
      if (!snapshot) {
        logDebug('queue poll missing entry, clearing state')
        handleQueueUpdate(null)
        return
      }
      logDebug('queue poll snapshot', snapshot)
      handleQueueUpdate(snapshot)
    } catch (err) {
      logDebug('queue poll fetch failed', err)
    }
  }, [fetchQueueEntryById, handleQueueUpdate, logDebug])

  const startQueuePolling = useCallback((entryId: string) => {
    if (queuePollEntryIdRef.current === entryId && queuePollIntervalRef.current) {
      return
    }
    stopQueuePolling()
    queuePollEntryIdRef.current = entryId
    queuePollIntervalRef.current = setInterval(() => {
      void pollQueueSnapshot(entryId)
    }, 3500)
    logDebug('queue polling activated', entryId)
  }, [pollQueueSnapshot, stopQueuePolling, logDebug])

  const subscribeToQueue = useCallback(function subscribeToQueueInner(entryId: string) {
    logDebug('subscribeToQueue: start', entryId)
    if (queueChannelRef.current) {
      logDebug('subscribeToQueue: replacing existing queue channel')
      void queueChannelRef.current.unsubscribe()
      supabase.removeChannel(queueChannelRef.current)
      queueChannelRef.current = null
    }
    if (queueRetryTimeoutRef.current) {
      clearTimeout(queueRetryTimeoutRef.current)
      queueRetryTimeoutRef.current = null
    }

    const channel = supabase
      .channel(`queue:${entryId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matchmaking_queue', filter: `id=eq.${entryId}` },
        payload => {
          logDebug('queue change payload', payload)
          if (payload.eventType === 'DELETE') {
            handleQueueUpdate(null)
            return
          }
          const updated = payload.new as MatchmakingQueueRow
          handleQueueUpdate(updated)
        }
      )
      .subscribe(status => {
        logDebug('queue channel status', status)
        if (status === 'SUBSCRIBED') {
          void (async () => {
            try {
              const data = await fetchQueueEntryById(entryId)
              logDebug('queue snapshot after subscribe', data)
              if (data) {
                handleQueueUpdate(data)
              } else {
                handleQueueUpdate(null)
              }
            } catch (err) {
              logDebug('queue snapshot fetch failed', err)
            }
          })()
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logDebug('queue channel degraded, scheduling retry', status)
          queueRetryTimeoutRef.current = setTimeout(() => {
            queueRetryTimeoutRef.current = null
            if (queueEntryRef.current?.id === entryId) {
              logDebug('queue channel retry subscribe')
              subscribeToQueueInner(entryId)
            } else {
              logDebug('queue channel retry skipped (entry changed)')
            }
          }, 1200)
        }
      })

    queueChannelRef.current = channel
  }, [fetchQueueEntryById, handleQueueUpdate, logDebug, supabase])

  useEffect(() => {
    if (queueEntry?.status === 'queued' && queueEntry.id) {
      startQueuePolling(queueEntry.id)
    } else {
      stopQueuePolling()
    }
  }, [queueEntry?.id, queueEntry?.status, startQueuePolling, stopQueuePolling])

  type MatchmakingJoinResult = {
    status: 'queued' | 'matched'
    queue_entry: MatchmakingQueueRow
    opponent_entry?: MatchmakingQueueRow | null
    room?: GameRoomRow | null
  }

  const joinQueue = useCallback(async (options: JoinOptions) => {
    logDebug('joinQueue:start', options)
    try {
      setError(null)
      if (!user) {
        logDebug('joinQueue: no user, signing in as guest')
        await signInAsGuest()
      }

      const currentUser = user ?? (await supabase.auth.getUser()).data.user
      if (!currentUser) {
        throw new Error('É necessário iniciar sessão para entrar na fila.')
      }
      logDebug('joinQueue:user ready', currentUser.id)

      setStatus('joining')
      syncPresence({ status: 'joining', queue_entry_id: null, mode: options.mode })

      const rating = options.ratingSnapshot ?? deriveRating(profile)
      const skillBracket = options.skillBracket ?? deriveSkillBracket(rating)
      const region = options.regionOverride ?? normalizeRegion(profile?.country_code)
      const matchCode = options.matchCode?.toUpperCase()
      const metadataRecord: Record<string, unknown> = {
        ...options.metadata,
        mode: options.mode,
        matchCode,
        presence_key: presenceClientIdRef.current
      }

      if (options.seat) {
        metadataRecord.seat = options.seat
      }

      const metadataJson = metadataRecord as Json

      logDebug('joinQueue:rpc input', {
        rating,
        skillBracket,
        region,
        metadata: metadataRecord
      })

      if (rpcAbortControllerRef.current) {
        rpcAbortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      rpcAbortControllerRef.current = abortController
      const timeoutId = setTimeout(() => {
        if (!abortController.signal.aborted) {
          logDebug('joinQueue:rpc timeout reached')
          abortController.abort()
        }
      }, MATCHMAKING_RPC_TIMEOUT_MS)

      let payload: MatchmakingJoinResult | null = null
      try {
        const { data, error: rpcError } = await supabase
          .rpc('matchmaking_join_and_create_room', {
            p_user_id: currentUser.id,
            p_game_type: gameType,
            p_rating_snapshot: rating,
            p_skill_bracket: skillBracket,
            p_region: region,
            p_metadata: metadataJson
          })

        if (rpcError || !data) {
          logDebug('joinQueue:rpc error', rpcError)
          throw rpcError ?? new Error('Resposta inválida do emparelhamento')
        }

        payload = data as MatchmakingJoinResult
      } catch (rpcErr) {
        if ((rpcErr as DOMException)?.name === 'AbortError') {
          const timeoutError = new Error('Tempo limite ao contactar o emparelhamento. Tenta novamente em instantes.')
          logDebug('joinQueue:rpc aborted', timeoutError.message)
          throw timeoutError
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

      logDebug('joinQueue:rpc response', payload)

      const queuePayload = payload.queue_entry as MatchmakingQueueRow
      setQueueEntry(queuePayload)
      subscribeToQueue(queuePayload.id)

      if (payload.room) {
        logDebug('joinQueue: immediate match with room', payload.room)
        const hydratedRoom = payload.room as GameRoomRow
        setRoom(hydratedRoom)
        subscribeToRoom(hydratedRoom.id)
        setStatus('matched')
        syncPresence({ status: 'matched', queue_entry_id: queuePayload.id, mode: options.mode })
        return queuePayload
      }

      const nextStatus = payload.status === 'matched' ? 'matched' : 'queued'
      logDebug('joinQueue: queued status', nextStatus)
      setStatus(nextStatus)
      syncPresence({ status: nextStatus, queue_entry_id: queuePayload.id, mode: options.mode })
      return queuePayload
    } catch (err) {
      let message = 'Falha ao entrar na fila'
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase PostgrestError objects
        const errorObj = err as Record<string, unknown>
        if (typeof errorObj.message === 'string') {
          message = errorObj.message
        } else if (typeof errorObj.error === 'string') {
          message = errorObj.error
        } else if (typeof errorObj.details === 'string') {
          message = errorObj.details
        }
      }
      logDebug('joinQueue:error', message, err)
      setError(message)
      setStatus('error')
      syncPresence({ status: 'error', queue_entry_id: null })
      throw new Error(message)
    }
  }, [gameType, logDebug, profile, signInAsGuest, subscribeToQueue, subscribeToRoom, supabase, syncPresence, user])

  const leaveQueue = useCallback(async () => {
    if (!queueEntry) return
    try {
      logDebug('leaveQueue:start', queueEntry.id)
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('id', queueEntry.id)
      setQueueEntry(null)
      setRoom(null)
      setStatus('idle')
      cleanupChannels()
      syncPresence({ status: 'idle', queue_entry_id: null })
    } catch (err) {
      console.error('Falha ao sair da fila', err)
      logDebug('leaveQueue:error', err)
    }
  }, [cleanupChannels, logDebug, queueEntry, supabase, syncPresence])

  const updateRoomState = useCallback(
    async (updater: (current: Json | null) => Json) => {
      if (!room) {
        throw new Error('Sem sala ativa para atualizar o estado.')
      }

      const currentState = (room.game_state as Json) ?? null
      const nextState = updater(currentState)
      logDebug('updateRoomState: next state', nextState)

      const { data, error: updateError } = await supabase
        .from('game_rooms')
        .update({ game_state: nextState })
        .eq('id', room.id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        logDebug('updateRoomState:error', updateError)
        throw updateError
      }

      logDebug('updateRoomState: success', data)
      setRoom(data)
    },
    [logDebug, room, supabase]
  )

  const resetMatch = useCallback(async () => {
    logDebug('resetMatch: clearing state')
    
    // Delete queue entry from database if it exists
    if (queueEntry?.id) {
      try {
        await supabase
          .from('matchmaking_queue')
          .delete()
          .eq('id', queueEntry.id)
        logDebug('resetMatch: deleted queue entry from database')
      } catch (err) {
        logDebug('resetMatch: failed to delete queue entry', err)
      }
    }
    
    setRoom(null)
    setQueueEntry(null)
    setStatus('idle')
    cleanupChannels()
    syncPresence({ status: 'idle', queue_entry_id: null })
  }, [cleanupChannels, logDebug, queueEntry?.id, supabase, syncPresence])

  return {
    status,
    queueEntry,
    room,
    error,
    lobbyStats,
    joinQueue,
    leaveQueue,
    updateRoomState,
    resetMatch
  }
}
