'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { TIMING } from '@/lib/constants'
import { logger } from '@/lib/logger'
import type { MatchmakingQueueRow, QueueStatus } from '@/lib/matchmaking/types'

interface UseMatchmakingQueueOptions {
  /** Called when queue entry is updated or matched */
  onQueueUpdate?: (entry: MatchmakingQueueRow | null) => void
  /** Called when a room ID is detected in matched entry */
  onMatchedWithRoom?: (roomId: string) => void
}

interface UseMatchmakingQueueReturn {
  /** Current queue entry */
  queueEntry: MatchmakingQueueRow | null
  /** Current queue status */
  queueStatus: QueueStatus
  /** Subscribe to a queue entry by ID */
  subscribeToQueue: (entryId: string) => void
  /** Update queue entry directly (e.g., after RPC call) */
  setQueueEntry: (entry: MatchmakingQueueRow | null) => void
  /** Set queue status */
  setQueueStatus: (status: QueueStatus) => void
  /** Fetch a queue entry by ID */
  fetchQueueEntryById: (entryId: string) => Promise<MatchmakingQueueRow | null>
  /** Stop all queue subscriptions and polling */
  cleanup: () => void
}

/**
 * Hook for managing matchmaking queue subscriptions
 * 
 * Handles:
 * - Queue entry postgres_changes subscription
 * - Polling as fallback when realtime fails
 * - Queue status updates
 * - Match detection
 */
export function useMatchmakingQueue(
  options: UseMatchmakingQueueOptions = {}
): UseMatchmakingQueueReturn {
  const { onQueueUpdate, onMatchedWithRoom } = options
  
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  
  const [queueEntry, setQueueEntry] = useState<MatchmakingQueueRow | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus>('idle')
  
  const queueChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollEntryIdRef = useRef<string | null>(null)
  const queueEntryRef = useRef<MatchmakingQueueRow | null>(null)

  // Keep entry ref in sync
  useEffect(() => {
    queueEntryRef.current = queueEntry
  }, [queueEntry])

  const logDebug = useCallback((...args: unknown[]) => {
    if (logger.env.isDevelopment) {
      console.debug('[queue]', ...args)
    }
  }, [])

  /**
   * Fetch queue entry by ID
   */
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

  /**
   * Handle queue entry update
   */
  const handleQueueUpdate = useCallback((entry: MatchmakingQueueRow | null) => {
    if (!entry) {
      logDebug('handleQueueUpdate: entry deleted')
      setQueueEntry(null)
      setQueueStatus('idle')
      onQueueUpdate?.(null)
      return
    }

    logDebug('handleQueueUpdate: entry data', entry)
    setQueueEntry(entry)
    onQueueUpdate?.(entry)

    if (entry.status === 'matched') {
      const meta = (entry.metadata ?? {}) as Record<string, unknown>
      const roomId = typeof meta.room_id === 'string' ? meta.room_id : null
      if (roomId) {
        logDebug('handleQueueUpdate: matched with room', roomId)
        onMatchedWithRoom?.(roomId)
      }
      setQueueStatus('matched')
    } else if (entry.status === 'queued') {
      setQueueStatus('queued')
    }
  }, [logDebug, onMatchedWithRoom, onQueueUpdate])

  /**
   * Stop queue polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    pollEntryIdRef.current = null
  }, [])

  /**
   * Poll queue entry as fallback
   */
  const pollQueueSnapshot = useCallback(async (entryId: string) => {
    try {
      const snapshot = await fetchQueueEntryById(entryId)
      if (!snapshot) {
        logDebug('poll: missing entry, clearing state')
        handleQueueUpdate(null)
        return
      }
      logDebug('poll: snapshot', snapshot)
      handleQueueUpdate(snapshot)
    } catch (err) {
      logDebug('poll: fetch failed', err)
    }
  }, [fetchQueueEntryById, handleQueueUpdate, logDebug])

  /**
   * Start polling for queue entry
   */
  const startPolling = useCallback((entryId: string) => {
    if (pollEntryIdRef.current === entryId && pollIntervalRef.current) {
      return
    }
    stopPolling()
    pollEntryIdRef.current = entryId
    pollIntervalRef.current = setInterval(() => {
      void pollQueueSnapshot(entryId)
    }, TIMING.QUEUE_POLL_INTERVAL_MS)
    logDebug('polling activated', entryId)
  }, [logDebug, pollQueueSnapshot, stopPolling])

  /**
   * Cleanup all channels and polling
   */
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    stopPolling()
    if (queueChannelRef.current) {
      logDebug('cleanup: removing queue channel')
      void queueChannelRef.current.unsubscribe()
      supabase.removeChannel(queueChannelRef.current)
      queueChannelRef.current = null
    }
  }, [logDebug, stopPolling, supabase])

  /**
   * Subscribe to queue entry changes
   */
  const subscribeToQueue = useCallback(function subscribeToQueueInner(entryId: string) {
    logDebug('subscribeToQueue: start', entryId)
    
    // Clean up existing
    if (queueChannelRef.current) {
      logDebug('subscribeToQueue: replacing existing channel')
      void queueChannelRef.current.unsubscribe()
      supabase.removeChannel(queueChannelRef.current)
      queueChannelRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
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
          handleQueueUpdate(payload.new as MatchmakingQueueRow)
        }
      )
      .subscribe(status => {
        logDebug('queue channel status', status)
        
        if (status === 'SUBSCRIBED') {
          // Fetch initial state after subscribe
          void (async () => {
            try {
              const data = await fetchQueueEntryById(entryId)
              logDebug('queue snapshot after subscribe', data)
              handleQueueUpdate(data)
            } catch (err) {
              logDebug('queue snapshot fetch failed', err)
            }
          })()
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logDebug('queue channel degraded, scheduling retry')
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null
            if (queueEntryRef.current?.id === entryId) {
              logDebug('queue channel retry subscribe')
              subscribeToQueueInner(entryId)
            } else {
              logDebug('queue channel retry skipped (entry changed)')
            }
          }, TIMING.MATCH_CHECK_DELAY_MS)
        }
      })

    queueChannelRef.current = channel
  }, [fetchQueueEntryById, handleQueueUpdate, logDebug, supabase])

  // Auto-start polling when queued
  useEffect(() => {
    if (queueEntry?.status === 'queued' && queueEntry.id) {
      startPolling(queueEntry.id)
    } else {
      stopPolling()
    }
  }, [queueEntry?.id, queueEntry?.status, startPolling, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return {
    queueEntry,
    queueStatus,
    subscribeToQueue,
    setQueueEntry,
    setQueueStatus,
    fetchQueueEntryById,
    cleanup
  }
}
