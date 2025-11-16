'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

export function useMatchmaking(gameType: SupportedMatchGame) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const { user, profile, signInAsGuest } = useAuth()
  const [status, setStatus] = useState<QueueStatus>('idle')
  const [queueEntry, setQueueEntry] = useState<MatchmakingQueueRow | null>(null)
  const [room, setRoom] = useState<GameRoomRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const queueChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const cleanupChannels = useCallback(() => {
    if (queueChannelRef.current) {
      supabase.removeChannel(queueChannelRef.current)
      queueChannelRef.current = null
    }
    if (roomChannelRef.current) {
      supabase.removeChannel(roomChannelRef.current)
      roomChannelRef.current = null
    }
  }, [supabase])

  useEffect(() => cleanupChannels, [cleanupChannels])

  const subscribeToRoom = useCallback((roomId: string) => {
    if (roomChannelRef.current) {
      supabase.removeChannel(roomChannelRef.current)
      roomChannelRef.current = null
    }

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        payload => {
          setRoom(payload.new as GameRoomRow)
        }
      )
      .subscribe()

    roomChannelRef.current = channel
  }, [supabase])

  const fetchRoom = useCallback(async (roomId: string) => {
    const { data, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) {
      console.error('Erro ao obter sala de jogo', roomError)
      setError(roomError.message)
      return
    }

    setRoom(data)
    subscribeToRoom(roomId)
  }, [subscribeToRoom, supabase])

  const subscribeToQueue = useCallback((entryId: string) => {
    if (queueChannelRef.current) {
      supabase.removeChannel(queueChannelRef.current)
      queueChannelRef.current = null
    }

    const channel = supabase
      .channel(`queue:${entryId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matchmaking_queue', filter: `id=eq.${entryId}` },
        payload => {
          const updated = payload.new as MatchmakingQueueRow
          setQueueEntry(updated)
          if (updated.status === 'matched') {
            const meta = (updated.metadata ?? {}) as Record<string, unknown>
            const roomId = typeof meta.room_id === 'string' ? meta.room_id : null
            if (roomId) {
              void fetchRoom(roomId)
            }
            setStatus('matched')
          }
        }
      )
      .subscribe()

    queueChannelRef.current = channel
  }, [fetchRoom, supabase])

  const joinQueue = useCallback(async (options: JoinOptions) => {
    try {
      setError(null)
      if (!user) {
        await signInAsGuest()
      }

      const currentUser = user ?? (await supabase.auth.getUser()).data.user
      if (!currentUser) {
        throw new Error('É necessário iniciar sessão para entrar na fila.')
      }

      setStatus('joining')

      const rating = options.ratingSnapshot ?? deriveRating(profile)
      const skillBracket = options.skillBracket ?? deriveSkillBracket(rating)
      const region = options.regionOverride ?? normalizeRegion(profile?.country_code)
      const metadata = {
        ...options.metadata,
        mode: options.mode,
        matchCode: options.matchCode?.toUpperCase(),
        seat: options.seat ?? 'host'
      }

      const payload = {
        user_id: currentUser.id,
        game_type: gameType,
        rating_snapshot: rating,
        skill_bracket: skillBracket,
        region,
        status: 'queued' as const,
        metadata
      }

      const { data, error: upsertError } = await supabase
        .from('matchmaking_queue')
        .upsert(payload, { onConflict: 'user_id,game_type,status' })
        .select()
        .single()

      if (upsertError) throw upsertError
      setQueueEntry(data)
      setStatus('queued')
      subscribeToQueue(data.id)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar na fila'
      setError(message)
      setStatus('error')
      throw err
    }
  }, [gameType, profile, signInAsGuest, subscribeToQueue, supabase, user])

  const leaveQueue = useCallback(async () => {
    if (!queueEntry) return
    try {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('id', queueEntry.id)
      setQueueEntry(null)
      setRoom(null)
      setStatus('idle')
      cleanupChannels()
    } catch (err) {
      console.error('Falha ao sair da fila', err)
    }
  }, [cleanupChannels, queueEntry, supabase])

  const updateRoomState = useCallback(
    async (updater: (current: Json | null) => Json) => {
      if (!room) {
        throw new Error('Sem sala ativa para atualizar o estado.')
      }

      const currentState = (room.game_state as Json) ?? null
      const nextState = updater(currentState)

      const { data, error: updateError } = await supabase
        .from('game_rooms')
        .update({ game_state: nextState })
        .eq('id', room.id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        throw updateError
      }

      setRoom(data)
    },
    [room, supabase]
  )

  const resetMatch = useCallback(() => {
    setRoom(null)
    setQueueEntry(null)
    setStatus('idle')
    cleanupChannels()
  }, [cleanupChannels])

  return {
    status,
    queueEntry,
    room,
    error,
    joinQueue,
    leaveQueue,
    updateRoomState,
    resetMatch
  }
}
