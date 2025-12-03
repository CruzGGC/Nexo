'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMatchmaking } from '@/hooks/matchmaking'
import { useBattleshipBoards } from './useBattleshipBoards'
import { useAuth } from '@/components/auth'
import { 
  parseRoomState, 
  hashFleetPositions, 
  checkShot,
  checkAllShipsSunk,
  type BattleshipRoomState,
  type BattleshipParticipant,
  type BattleshipPhase
} from '@/lib/types/battleship'
import type { Json } from '@/lib/supabase'

interface UseOnlineBattleshipReturn {
  /** Matchmaking status */
  status: ReturnType<typeof useMatchmaking>['status']
  /** Parsed room state */
  roomState: BattleshipRoomState
  /** Current user's ID */
  myId: string | undefined
  /** Opponent participant */
  opponent: BattleshipParticipant | undefined
  /** Whether it's my turn */
  isMyTurn: boolean
  /** Current game phase */
  phase: BattleshipPhase
  /** Room code for private matches */
  roomCode: string | undefined
  /** Winner ID if game is finished */
  winner: string | undefined
  /** Player's boards */
  boards: ReturnType<typeof useBattleshipBoards>
  /** Join public matchmaking queue */
  joinPublic: () => void
  /** Create private match with code */
  createPrivate: (code: string) => void
  /** Join private match with code */
  joinPrivate: (code: string) => void
  /** Cancel matchmaking */
  cancelMatchmaking: () => void
  /** Confirm ship placement */
  confirmPlacement: () => Promise<void>
  /** Handle attack click */
  handleAttack: (row: number, col: number) => Promise<void>
  /** Reset match */
  resetMatch: () => void
}

/**
 * Hook for managing online battleship multiplayer
 * 
 * SECURITY: This hook implements secure fleet handling:
 * - Fleet positions are NEVER shared with opponents via game_state
 * - Only a hash of fleet positions is stored for verification
 * - Hit detection is done locally, results are broadcast
 * - Move history is kept for validation
 */
export function useOnlineBattleship(): UseOnlineBattleshipReturn {
  const { user } = useAuth()
  const myId = user?.id

  const boards = useBattleshipBoards()
  const { 
    status, 
    room, 
    joinQueue, 
    resetMatch: resetMatchmaking
  } = useMatchmaking('battleship')

  // Track if we've already confirmed placement to prevent double-submission
  const [hasConfirmedPlacement, setHasConfirmedPlacement] = useState(false)
  
  // Track processed moves to prevent reprocessing
  const processedMoveRef = useRef<string | null>(null)
  const processedIncomingRef = useRef<string | null>(null)

  // Parse room state safely
  const roomState = useMemo(
    () => parseRoomState(room?.game_state as Json | null),
    [room?.game_state]
  )

  const opponent = useMemo(
    () => roomState.participants.find(p => p.id !== myId),
    [roomState.participants, myId]
  )

  const isMyTurn = roomState.currentPlayer === myId
  const phase = roomState.phase
  const roomCode = roomState.room_code
  const winner = roomState.winner

  // Sync incoming attacks from opponent
  useEffect(() => {
    if (status !== 'matched' || phase !== 'battle') return
    if (!roomState.lastMove) return

    const { row, col, result, by, timestamp } = roomState.lastMove
    
    // Create a unique key for this move to prevent reprocessing
    const moveKey = `${row}-${col}-${timestamp}`
    if (processedMoveRef.current === moveKey) return
    processedMoveRef.current = moveKey

    if (by === myId) {
      // My move - update my target board with the result
      boards.markTargetResult(row, col, result)
    } else {
      // Opponent's move - update my incoming attacks display
      boards.receiveAttack(row, col)
    }
  }, [roomState.lastMove, status, phase, myId, boards])

  // Matchmaking handlers
  const joinPublic = useCallback(() => {
    joinQueue({ mode: 'public' })
  }, [joinQueue])

  const createPrivate = useCallback((code: string) => {
    joinQueue({ mode: 'private', matchCode: code, seat: 'host' })
  }, [joinQueue])

  const joinPrivate = useCallback((code: string) => {
    joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })
  }, [joinQueue])

  const cancelMatchmaking = useCallback(() => {
    resetMatchmaking()
  }, [resetMatchmaking])

  /**
   * Get the supabase client for direct updates
   */
  const getSupabase = useCallback(async () => {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase')
    return getSupabaseBrowserClient()
  }, [])

  /**
   * Confirm ship placement
   * 
   * SECURITY: We only send a hash of the fleet, not actual positions
   */
  const confirmPlacement = useCallback(async () => {
    if (!room || !myId || hasConfirmedPlacement) return
    
    setHasConfirmedPlacement(true)

    const supabase = await getSupabase()
    
    // Create fleet hash - this is what gets stored, NOT the actual positions
    const fleetHash = hashFleetPositions(boards.ocean)

    // Fetch current state to merge
    const { data: currentRoom } = await supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', room.id)
      .single()

    const currentState = parseRoomState(currentRoom?.game_state as Json | null)

    // Update my participant entry with ready status and fleet hash
    const updatedParticipants = currentState.participants.map(p => {
      if (p.id === myId) {
        return {
          ...p,
          ready: true,
          fleetHash, // ONLY the hash, not positions!
          hitsReceived: []
        }
      }
      return p
    })

    // Check if both players are ready
    const allReady = updatedParticipants.every(p => p.ready) && 
                     updatedParticipants.length === 2

    const newState: BattleshipRoomState = {
      ...currentState,
      participants: updatedParticipants,
      phase: allReady ? 'battle' : 'placement',
      currentPlayer: allReady ? updatedParticipants[0].id : undefined,
      moveHistory: []
    }

    await supabase
      .from('game_rooms')
      .update({ game_state: newState as unknown as Json })
      .eq('id', room.id)

  }, [room, myId, hasConfirmedPlacement, getSupabase, boards.ocean])

  /**
   * Handle attack click
   * 
   * SECURITY: Hit detection is done locally using our own ocean.
   * The result is then broadcast to the opponent.
   */
  const handleAttack = useCallback(async (row: number, col: number) => {
    if (!room || !myId || !isMyTurn) return
    if (phase !== 'battle') return

    // Prevent double clicks
    if (boards.targetBoard[row][col] !== '') return

    const supabase = await getSupabase()

    // Fetch current state
    const { data: currentRoom } = await supabase
      .from('game_rooms')
      .select('game_state')
      .eq('id', room.id)
      .single()

    const currentState = parseRoomState(currentRoom?.game_state as Json | null)

    // IMPORTANT: We can't know if it's a hit without the opponent's fleet
    // We mark it as 'pending' and the opponent's client will confirm
    // For now, we use a simplified model where the server doesn't validate
    // In a production system, you'd use a server function for this

    // For this implementation, we'll use a request/response pattern:
    // We send the shot, opponent's client responds with result

    const move = {
      row,
      col,
      result: 'pending' as 'hit' | 'miss', // Will be updated by opponent
      by: myId,
      timestamp: Date.now()
    }

    // Add move to history
    const moveHistory = [...(currentState.moveHistory || []), move]

    // Switch turn to opponent
    const newState: BattleshipRoomState = {
      ...currentState,
      currentPlayer: opponent?.id,
      lastMove: move,
      moveHistory
    }

    await supabase
      .from('game_rooms')
      .update({ game_state: newState as unknown as Json })
      .eq('id', room.id)

    // Mark as pending on our board until confirmed
    boards.markTargetResult(row, col, 'pending' as 'hit' | 'miss')

  }, [room, myId, isMyTurn, phase, boards, getSupabase, opponent?.id])

  /**
   * Process incoming attack and respond with result
   * 
   * This runs when opponent attacks us - we check against our local ocean
   * and broadcast the result
   */
  useEffect(() => {
    if (!room || !myId || status !== 'matched') return
    if (phase !== 'battle') return
    
    const lastMove = roomState.lastMove
    if (!lastMove) return
    
    // Only process if it's an attack against us (opponent's move)
    if (lastMove.by === myId) return
    
    // Only process pending moves
    if (lastMove.result !== 'pending' as unknown) return
    
    // Prevent reprocessing the same move
    const incomingKey = `${lastMove.row}-${lastMove.col}-${lastMove.timestamp}`
    if (processedIncomingRef.current === incomingKey) return
    processedIncomingRef.current = incomingKey

    // Check hit against our local ocean
    const result = checkShot(boards.ocean, lastMove.row, lastMove.col)

    // Update the move with actual result
    const processResult = async () => {
      const supabase = await getSupabase()

      const { data: currentRoom } = await supabase
        .from('game_rooms')
        .select('game_state')
        .eq('id', room.id)
        .single()

      const currentState = parseRoomState(currentRoom?.game_state as Json | null)

      // Update my hits received
      const myParticipant = currentState.participants.find(p => p.id === myId)
      const updatedHitsReceived = [
        ...(myParticipant?.hitsReceived || []),
        `${lastMove.row},${lastMove.col}`
      ]

      // Check if I'm defeated
      const defeated = result === 'hit' && 
        checkAllShipsSunk(boards.ocean, updatedHitsReceived)

      const updatedParticipants = currentState.participants.map(p => {
        if (p.id === myId) {
          return {
            ...p,
            hitsReceived: updatedHitsReceived,
            defeated
          }
        }
        return p
      })

      // Update move with actual result
      const confirmedMove = { ...lastMove, result }

      // Update move history
      const moveHistory = currentState.moveHistory?.map(m =>
        m.timestamp === lastMove.timestamp ? confirmedMove : m
      ) || [confirmedMove]

      const newState: BattleshipRoomState = {
        ...currentState,
        participants: updatedParticipants,
        lastMove: confirmedMove,
        moveHistory,
        phase: defeated ? 'finished' : 'battle',
        winner: defeated ? lastMove.by : undefined
      }

      await supabase
        .from('game_rooms')
        .update({ game_state: newState as unknown as Json })
        .eq('id', room.id)

      // Update our incoming attacks display
      boards.receiveAttack(lastMove.row, lastMove.col)
    }

    processResult()
  }, [roomState.lastMove, room, myId, status, phase, boards, getSupabase])

  /**
   * Reset match state
   */
  const resetMatch = useCallback(() => {
    setHasConfirmedPlacement(false)
    boards.resetFleet()
    boards.resetTargets()
    resetMatchmaking()
  }, [boards, resetMatchmaking])

  // Reset placement confirmation when leaving a match
  useEffect(() => {
    if (status === 'idle') {
      setHasConfirmedPlacement(false)
    }
  }, [status])

  return {
    status,
    roomState,
    myId,
    opponent,
    isMyTurn,
    phase,
    roomCode,
    winner,
    boards,
    joinPublic,
    createPrivate,
    joinPrivate,
    cancelMatchmaking,
    confirmPlacement,
    handleAttack,
    resetMatch
  }
}
