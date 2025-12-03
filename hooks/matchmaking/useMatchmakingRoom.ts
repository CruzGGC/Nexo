'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { GameRoomRow, Json } from '@/lib/matchmaking/types'

interface UseMatchmakingRoomReturn {
  /** Current game room */
  room: GameRoomRow | null
  /** Room error message */
  roomError: string | null
  /** Set room directly */
  setRoom: (room: GameRoomRow | null) => void
  /** Fetch room by ID and subscribe to changes */
  fetchRoom: (roomId: string) => Promise<void>
  /** Subscribe to room changes */
  subscribeToRoom: (roomId: string) => void
  /** Update room game state */
  updateRoomState: (updater: (current: Json | null) => Json) => Promise<void>
  /** Cleanup room subscription */
  cleanup: () => void
}

/**
 * Hook for managing game room subscriptions and state
 * 
 * Handles:
 * - Room postgres_changes subscription
 * - Room fetching
 * - Game state updates
 */
export function useMatchmakingRoom(): UseMatchmakingRoomReturn {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  
  const [room, setRoom] = useState<GameRoomRow | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const logDebug = useCallback((...args: unknown[]) => {
    if (logger.env.isDevelopment) {
      console.debug('[room]', ...args)
    }
  }, [])

  /**
   * Cleanup room channel
   */
  const cleanup = useCallback(() => {
    if (roomChannelRef.current) {
      logDebug('cleanup: removing room channel')
      void roomChannelRef.current.unsubscribe()
      supabase.removeChannel(roomChannelRef.current)
      roomChannelRef.current = null
    }
  }, [logDebug, supabase])

  /**
   * Subscribe to room changes
   */
  const subscribeToRoom = useCallback((roomId: string) => {
    logDebug('subscribeToRoom: start', roomId)
    
    // Clean up existing
    if (roomChannelRef.current) {
      logDebug('subscribeToRoom: replacing existing channel')
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
          const newRoom = payload.new as GameRoomRow
          // Only update if actually changed (compare JSON to avoid unnecessary renders)
          setRoom(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(newRoom)) {
              return prev
            }
            return newRoom
          })
        }
      )
      .subscribe(status => {
        logDebug('room channel status', status)
      })

    roomChannelRef.current = channel
  }, [logDebug, supabase])

  /**
   * Fetch room by ID and subscribe
   */
  const fetchRoom = useCallback(async (roomId: string) => {
    logDebug('fetchRoom: start', roomId)
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) {
      logger.error('Erro ao obter sala de jogo', error)
      setRoomError(error.message)
      return
    }

    logDebug('fetchRoom: success', data)
    setRoom(data)
    subscribeToRoom(roomId)
  }, [logDebug, subscribeToRoom, supabase])

  /**
   * Update room game state
   */
  const updateRoomState = useCallback(async (
    updater: (current: Json | null) => Json
  ) => {
    if (!room) {
      throw new Error('Sem sala ativa para atualizar o estado.')
    }

    const currentState = (room.game_state as Json) ?? null
    const nextState = updater(currentState)
    logDebug('updateRoomState: next state', nextState)

    const { data, error } = await supabase
      .from('game_rooms')
      .update({ game_state: nextState })
      .eq('id', room.id)
      .select()
      .single()

    if (error) {
      setRoomError(error.message)
      logDebug('updateRoomState: error', error)
      throw error
    }

    logDebug('updateRoomState: success', data)
    setRoom(data)
  }, [logDebug, room, supabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return {
    room,
    roomError,
    setRoom,
    fetchRoom,
    subscribeToRoom,
    updateRoomState,
    cleanup
  }
}
