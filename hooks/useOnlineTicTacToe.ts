/**
 * Hook for online TicTacToe game with matchmaking
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useAuth } from '@/components/AuthProvider'
import type { Json } from '@/lib/database.types'
import type { 
  CellValue, 
  GameScore, 
  TicTacToeGameState,
  SeriesState
} from '@/lib/types/tictactoe'
import { 
  checkWinner, 
  isBoardFull, 
  createEmptyBoard,
  createInitialSeries,
  getNextPlayer,
  parseRoomState,
  SERIES_WINS_REQUIRED
} from '@/lib/types/tictactoe'

interface Participant {
  id: string
  display_name?: string
}

interface UseOnlineTicTacToeReturn {
  // Game state
  gameState: TicTacToeGameState
  seriesState: SeriesState
  isGameInitialized: boolean
  
  // Player info
  mySymbol: CellValue
  opponent: Participant | undefined
  
  // Matchmaking
  status: ReturnType<typeof useMatchmaking>['status']
  roomCode: string | undefined
  
  // Actions
  handleCellClick: (index: number) => Promise<void>
  handleAdvanceRound: () => Promise<void>
  joinQueue: (options: { mode: 'public' | 'private'; matchCode?: string; seat?: 'host' | 'guest' }) => void
  leaveQueue: () => void
  resetMatch: () => Promise<void>
  
  // Loading states
  isUpdating: boolean
}

export function useOnlineTicTacToe(): UseOnlineTicTacToeReturn {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const initializingRef = useRef(false)

  const { 
    status, 
    room, 
    joinQueue, 
    leaveQueue, 
    updateRoomState, 
    resetMatch 
  } = useMatchmaking('tic_tac_toe')

  // Parse room state
  const roomState = useMemo(
    () => parseRoomState(room?.game_state),
    [room?.game_state]
  )

  // Participants and identification
  const participants = useMemo<Participant[]>(
    () => roomState.participants || [],
    [roomState.participants]
  )
  
  const myId = user?.id
  const opponent = useMemo(
    () => participants.find(p => p.id !== myId),
    [participants, myId]
  )

  // Determine player symbol (host is X)
  const mySymbol = useMemo<CellValue>(() => {
    if (!participants.length) return 'X'
    return participants[0]?.id === myId ? 'X' : 'O'
  }, [participants, myId])

  // Game state from room
  const board = roomState.board || createEmptyBoard()
  const currentPlayer = roomState.currentPlayer || 'X'
  const winner = roomState.winner || null
  const winningLine = roomState.winningLine || null
  const isDraw = roomState.isDraw || false
  const isGameInitialized = roomState.initialized === true
  const roomCode = roomState.room_code

  // Series state
  const seriesState = useMemo<SeriesState>(
    () => roomState.series || createInitialSeries(),
    [roomState.series]
  )

  // Score from series
  const score: GameScore = useMemo(() => ({
    x: seriesState.xWins,
    o: seriesState.oWins,
    draws: 0 // Series doesn't track draws separately
  }), [seriesState.xWins, seriesState.oWins])

  // Turn check
  const isMyTurn = isGameInitialized && currentPlayer === mySymbol && !isUpdating

  // Initialize game (host only)
  const initializeGame = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true
    
    try {
      await updateRoomState((current) => {
        const currentState = parseRoomState(current)
        if (currentState.initialized) {
          return current as Json
        }
        
        return {
          ...currentState,
          board: createEmptyBoard(),
          currentPlayer: 'X',
          winner: null,
          winningLine: null,
          isDraw: false,
          initialized: true,
          participants: participants.map(p => ({ 
            id: p.id, 
            display_name: p.display_name 
          })),
          series: createInitialSeries()
        } as unknown as Json
      })
    } catch (err) {
      console.error('Failed to initialize game:', err)
    } finally {
      initializingRef.current = false
    }
  }, [updateRoomState, participants])

  // Auto-initialize when matched (host only)
  useEffect(() => {
    if (status === 'matched' && participants.length >= 2 && !roomState.initialized) {
      const isHost = participants[0]?.id === myId
      if (isHost) {
        initializeGame()
      }
    }
  }, [status, participants, myId, roomState.initialized, initializeGame])

  // Handle cell click
  const handleCellClick = useCallback(async (index: number) => {
    if (board[index] || winner || isDraw) return
    if (!isMyTurn || isUpdating || !isGameInitialized) return

    const nextBoard = [...board]
    nextBoard[index] = currentPlayer

    const winResult = checkWinner(nextBoard)
    const nextWinner = winResult?.winner || null
    const nextWinningLine = winResult?.line || null
    const nextIsDraw = !nextWinner && isBoardFull(nextBoard)
    const nextPlayer = getNextPlayer(currentPlayer)

    setIsUpdating(true)
    try {
      await updateRoomState((current) => {
        const currentState = parseRoomState(current)
        
        // Verify it's still my turn and cell is empty
        if (currentState.currentPlayer !== mySymbol || currentState.board?.[index]) {
          return current as Json
        }
        
        return {
          ...currentState,
          board: nextBoard,
          currentPlayer: nextPlayer,
          winner: nextWinner,
          winningLine: nextWinningLine,
          isDraw: nextIsDraw,
          lastMoveBy: myId,
          lastMoveAt: Date.now()
        } as unknown as Json
      })
    } catch (err) {
      console.error('Failed to update game state:', err)
    } finally {
      setIsUpdating(false)
    }
  }, [board, currentPlayer, winner, isDraw, isMyTurn, isUpdating, isGameInitialized, mySymbol, myId, updateRoomState])

  // Advance to next round in series
  const handleAdvanceRound = useCallback(async () => {
    setIsUpdating(true)
    try {
      await updateRoomState((current) => {
        const currentState = parseRoomState(current)
        const currentSeries = currentState.series || createInitialSeries()
        
        // Update wins based on current round winner
        let newXWins = currentSeries.xWins
        let newOWins = currentSeries.oWins
        
        if (currentState.winner === 'X') {
          newXWins++
        } else if (currentState.winner === 'O') {
          newOWins++
        }
        // Draws don't count - replay the round
        
        // Check if series is complete
        const isSeriesComplete = newXWins >= SERIES_WINS_REQUIRED || newOWins >= SERIES_WINS_REQUIRED
        const seriesWinner = newXWins >= SERIES_WINS_REQUIRED 
          ? 'X' 
          : newOWins >= SERIES_WINS_REQUIRED 
            ? 'O' 
            : null
        
        return {
          ...currentState,
          board: createEmptyBoard(),
          currentPlayer: 'X',
          winner: null,
          winningLine: null,
          isDraw: false,
          initialized: true,
          lastMoveBy: null,
          lastMoveAt: Date.now(),
          series: {
            xWins: newXWins,
            oWins: newOWins,
            roundNumber: isSeriesComplete 
              ? currentSeries.roundNumber 
              : currentSeries.roundNumber + 1,
            isSeriesComplete,
            seriesWinner
          }
        } as unknown as Json
      })
    } catch (err) {
      console.error('Failed to advance round:', err)
    } finally {
      setIsUpdating(false)
    }
  }, [updateRoomState])

  // Build status message
  const statusMessage = useMemo(() => {
    if (!isGameInitialized) {
      return 'A inicializar jogo...'
    }
    if (winner) {
      return winner === mySymbol 
        ? 'Ganhaste esta ronda!' 
        : 'Perdeste esta ronda!'
    }
    if (isDraw) {
      return 'Empate! A ronda será repetida.'
    }
    return isMyTurn 
      ? 'A tua vez!' 
      : `Aguardando ${opponent?.display_name || 'adversário'}...`
  }, [isGameInitialized, winner, isDraw, isMyTurn, mySymbol, opponent?.display_name])

  const gameState: TicTacToeGameState = {
    board,
    currentPlayer,
    winner,
    winningLine,
    isDraw,
    score,
    isMyTurn,
    statusMessage
  }

  return {
    gameState,
    seriesState,
    isGameInitialized,
    mySymbol,
    opponent,
    status,
    roomCode,
    handleCellClick,
    handleAdvanceRound,
    joinQueue,
    leaveQueue,
    resetMatch,
    isUpdating
  }
}
