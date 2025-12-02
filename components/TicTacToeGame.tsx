'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useAuth } from '@/components/AuthProvider'
import { ModeSelection } from '@/components/tictactoe/ModeSelection'
import { MatchmakingView } from '@/components/tictactoe/MatchmakingView'
import { GameBoard } from '@/components/tictactoe/GameBoard'
import { GameResultModal } from '@/components/GameResultModal'
import type { Json } from '@/lib/database.types'

type ViewMode = 'selection' | 'matchmaking' | 'game' | 'series-result'
type CellValue = 'X' | 'O' | null

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

const SERIES_WINS_REQUIRED = 3 // Best of 5

type SeriesState = {
  xWins: number
  oWins: number
  roundNumber: number
  isSeriesComplete: boolean
  seriesWinner?: 'X' | 'O' | null
}

type RoomState = {
  board?: CellValue[]
  currentPlayer?: CellValue
  winner?: CellValue | null
  winningLine?: number[] | null
  isDraw?: boolean
  participants?: { id: string; display_name?: string }[]
  room_code?: string
  initialized?: boolean
  lastMoveBy?: string
  lastMoveAt?: number
  series?: SeriesState
}

export default function TicTacToeGame() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection')
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local')
  const { user } = useAuth()

  // Game State
  const [localBoard, setLocalBoard] = useState<CellValue[]>(Array(9).fill(null))
  const [localCurrentPlayer, setLocalCurrentPlayer] = useState<CellValue>('X')
  const [localWinner, setLocalWinner] = useState<CellValue | null>(null)
  const [localWinningLine, setLocalWinningLine] = useState<number[] | null>(null)
  const [localIsDraw, setLocalIsDraw] = useState(false)
  const [score, setScore] = useState({ x: 0, o: 0, draws: 0 })
  const [isUpdating, setIsUpdating] = useState(false)
  const initializingRef = useRef(false)

  const { status, room, joinQueue, leaveQueue, updateRoomState, resetMatch } = useMatchmaking('tic_tac_toe')

  // --- Derived State ---
  const roomState = useMemo(() => (room?.game_state as unknown as RoomState) || {}, [room?.game_state])
  const participants = useMemo(() => {
    // Get participants from game_state
    return roomState.participants || []
  }, [roomState.participants])
  const myId = user?.id
  const opponent = participants.find((p) => p.id !== myId)

  // Determine if I am X or O (Host is usually X)
  const mySymbol = useMemo(() => {
    if (gameMode === 'local') return localCurrentPlayer // In local, I am whoever's turn it is
    if (!participants.length) return 'X'
    // First player (host) is X
    return participants[0].id === myId ? 'X' : 'O'
  }, [gameMode, participants, myId, localCurrentPlayer])

  const activeBoard = gameMode === 'local' ? localBoard : (roomState.board || Array(9).fill(null))
  const activeCurrentPlayer = gameMode === 'local' ? localCurrentPlayer : (roomState.currentPlayer || 'X')
  const activeWinner = gameMode === 'local' ? localWinner : roomState.winner
  const activeWinningLine = gameMode === 'local' ? localWinningLine : roomState.winningLine
  const activeIsDraw = gameMode === 'local' ? localIsDraw : roomState.isDraw
  const isGameInitialized = gameMode === 'local' ? true : roomState.initialized === true

  // Series state for online mode (best of 5)
  const seriesState = useMemo(() => roomState.series || {
    xWins: 0,
    oWins: 0,
    roundNumber: 1,
    isSeriesComplete: false,
    seriesWinner: null
  }, [roomState.series])
  
  const onlineScore = useMemo(() => ({
    x: seriesState.xWins,
    o: seriesState.oWins,
    draws: 0 // Series doesn't track draws separately
  }), [seriesState.xWins, seriesState.oWins])
  
  // Use local score for local mode, series score for online
  const activeScore = gameMode === 'local' ? score : onlineScore

  // Series result modal state for online
  const [showSeriesResult, setShowSeriesResult] = useState(false)
  const seriesResultCheckedRef = useRef(false)

  const isMyTurn = gameMode === 'local' ? true : (isGameInitialized && activeCurrentPlayer === mySymbol && !isUpdating)

  // --- Effects ---

  useEffect(() => {
    if (status === 'matched') {
      const timer = setTimeout(() => {
        setViewMode((prev) => {
          if (prev === 'matchmaking') {
            return 'game'
          }
          return prev
        })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [status])

  // Initialize game state - only host does this, with lock
  const initializeGame = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true
    
    try {
      await updateRoomState((current) => {
        const currentState = (current as unknown as RoomState) || {}
        // Double-check initialization hasn't happened
        if (currentState.initialized) {
          return current as Json
        }
        return {
          ...currentState,
          board: Array(9).fill(null),
          currentPlayer: 'X',
          winner: null,
          winningLine: null,
          isDraw: false,
          initialized: true,
          participants: participants.map(p => ({ id: p.id, display_name: p.display_name })),
          series: {
            xWins: 0,
            oWins: 0,
            roundNumber: 1,
            isSeriesComplete: false,
            seriesWinner: null
          }
        } as unknown as Json
      })
    } catch (err) {
      console.error('Failed to initialize game:', err)
    } finally {
      initializingRef.current = false
    }
  }, [updateRoomState, participants])

  useEffect(() => {
    if (status === 'matched' && participants.length >= 2 && !roomState.initialized) {
      // Only host (first participant) initializes
      const isHost = participants[0]?.id === myId
      if (isHost) {
        initializeGame()
      }
    }
  }, [status, participants, myId, roomState.initialized, initializeGame])

  // Show series result modal when online series is complete
  useEffect(() => {
    if (gameMode === 'online' && seriesState.isSeriesComplete && !seriesResultCheckedRef.current) {
      seriesResultCheckedRef.current = true
      setShowSeriesResult(true)
    }
  }, [gameMode, seriesState.isSeriesComplete])
  
  // Reset series result check when series resets
  useEffect(() => {
    if (!seriesState.isSeriesComplete) {
      seriesResultCheckedRef.current = false
    }
  }, [seriesState.isSeriesComplete])

  // --- Logic ---

  const checkWinner = (board: CellValue[]) => {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: pattern }
      }
    }
    return null
  }

  const handleCellClick = async (index: number) => {
    if (activeBoard[index] || activeWinner || activeIsDraw) return
    if (gameMode === 'online' && (!isMyTurn || isUpdating || !isGameInitialized)) return

    const nextBoard = [...activeBoard]
    nextBoard[index] = activeCurrentPlayer

    const winResult = checkWinner(nextBoard)
    const nextWinner = winResult?.winner || null
    const nextWinningLine = winResult?.line || null
    const nextIsDraw = !nextWinner && nextBoard.every((cell) => cell !== null)
    const nextPlayer = activeCurrentPlayer === 'X' ? 'O' : 'X'

    if (gameMode === 'local') {
      setLocalBoard(nextBoard)
      setLocalWinner(nextWinner)
      setLocalWinningLine(nextWinningLine)
      setLocalIsDraw(nextIsDraw)
      setLocalCurrentPlayer(nextPlayer)

      if (nextWinner) {
        setScore(prev => ({ ...prev, [nextWinner.toLowerCase()]: prev[nextWinner.toLowerCase() as 'x' | 'o'] + 1 }))
      } else if (nextIsDraw) {
        setScore(prev => ({ ...prev, draws: prev.draws + 1 }))
      }
    } else {
      // Set updating flag to prevent double moves
      setIsUpdating(true)
      try {
        await updateRoomState((current) => {
          const currentState = (current as unknown as RoomState) || {}
          // Verify it's still my turn and the cell is empty
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
    }
  }

  const handleReset = async () => {
    if (gameMode === 'local') {
      setLocalBoard(Array(9).fill(null))
      setLocalCurrentPlayer('X')
      setLocalWinner(null)
      setLocalWinningLine(null)
      setLocalIsDraw(false)
    } else {
      // For online mode, this should advance to next round in the series
      await handleAdvanceRound()
    }
  }
  
  // Advance to next round in the series (online only)
  const handleAdvanceRound = useCallback(async () => {
    if (!room || gameMode !== 'online') return
    
    setIsUpdating(true)
    try {
      await updateRoomState((current) => {
        const currentState = (current as unknown as RoomState) || {}
        const currentSeries = currentState.series || {
          xWins: 0,
          oWins: 0,
          roundNumber: 1,
          isSeriesComplete: false,
          seriesWinner: null
        }
        
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
        const seriesWinner = newXWins >= SERIES_WINS_REQUIRED ? 'X' : newOWins >= SERIES_WINS_REQUIRED ? 'O' : null
        
        return {
          ...currentState,
          board: Array(9).fill(null),
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
            roundNumber: isSeriesComplete ? currentSeries.roundNumber : currentSeries.roundNumber + 1,
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
  }, [gameMode, room, updateRoomState])

  // --- Handlers ---

  const handleSelectMode = (mode: 'local' | 'online') => {
    setGameMode(mode)
    if (mode === 'online') {
      setViewMode('matchmaking')
    } else {
      setViewMode('game')
      handleReset()
    }
  }

  const handleJoinPublic = () => joinQueue({ mode: 'public' })
  const handleCreatePrivate = (code: string) => joinQueue({ mode: 'private', matchCode: code, seat: 'host' })
  const handleJoinPrivate = (code: string) => joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })

  const handleCancelMatchmaking = () => {
    // Use resetMatch to fully clear all matchmaking state
    resetMatch()
    setViewMode('selection')
  }
  
  const handleSeriesResultClose = () => {
    setShowSeriesResult(false)
    // Reset matchmaking and return to selection
    void resetMatch()
    setViewMode('selection')
  }
  
  // Determine series result for modal
  const mySeriesResult = useMemo(() => {
    if (!seriesState.seriesWinner) return 'draw'
    const iWon = (mySymbol === seriesState.seriesWinner)
    return iWon ? 'victory' : 'defeat'
  }, [mySymbol, seriesState.seriesWinner])

  // --- Render ---

  return (
    <div className="min-h-screen w-full bg-[#030014] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-[128px] animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-6xl">

        {viewMode === 'selection' && (
          <ModeSelection onSelectMode={handleSelectMode} />
        )}

        {viewMode === 'matchmaking' && (
          <MatchmakingView
            onJoinPublic={handleJoinPublic}
            onCreatePrivate={handleCreatePrivate}
            onJoinPrivate={handleJoinPrivate}
            onCancel={handleCancelMatchmaking}
            status={status}
            roomCode={roomState.room_code}
          />
        )}

        {viewMode === 'game' && (
          <>
            {/* Series info banner for online mode */}
            {gameMode === 'online' && (
              <div className="mb-4 text-center">
                <div className="inline-block rounded-full bg-white/5 px-6 py-2 text-sm text-slate-300 border border-white/10">
                  <span className="font-medium">Melhor de 5</span>
                  <span className="mx-3 text-white/30">|</span>
                  <span>Ronda {seriesState.roundNumber}</span>
                  <span className="mx-3 text-white/30">|</span>
                  <span className={mySymbol === 'X' ? 'text-blue-400' : 'text-purple-400'}>
                    Tu ({mySymbol}): {mySymbol === 'X' ? seriesState.xWins : seriesState.oWins}
                  </span>
                  <span className="mx-2">-</span>
                  <span className={mySymbol === 'X' ? 'text-purple-400' : 'text-blue-400'}>
                    {opponent?.display_name || 'Adversário'}: {mySymbol === 'X' ? seriesState.oWins : seriesState.xWins}
                  </span>
                </div>
              </div>
            )}
            
            <GameBoard
              board={activeBoard}
              onCellClick={handleCellClick}
              currentPlayer={activeCurrentPlayer}
              isMyTurn={isMyTurn}
              winner={activeWinner || null}
              winningLine={activeWinningLine || null}
              isDraw={activeIsDraw}
              onReset={handleReset}
              statusMessage={
                !isGameInitialized && gameMode === 'online'
                  ? 'A inicializar jogo...'
                  : activeWinner
                  ? gameMode === 'online'
                    ? `${activeWinner === mySymbol ? 'Ganhaste' : 'Perdeste'} esta ronda!`
                    : `Vencedor: ${activeWinner === 'X' ? 'Jogador X' : 'Jogador O'}!`
                  : activeIsDraw
                    ? 'Empate! A ronda será repetida.'
                    : gameMode === 'local'
                      ? `Vez do Jogador ${activeCurrentPlayer}`
                      : isMyTurn
                        ? 'A tua vez!'
                        : `Aguardando ${opponent?.display_name || 'adversário'}...`
              }
              opponentName={gameMode === 'local' ? (activeCurrentPlayer === 'X' ? 'Jogador O' : 'Jogador X') : opponent?.display_name}
              score={activeScore}
              gameMode={gameMode}
              resetLabel={gameMode === 'online' && (activeWinner || activeIsDraw) ? 'Próxima Ronda' : undefined}
            />
          </>
        )}
        
        {/* Series Result Modal */}
        {showSeriesResult && gameMode === 'online' && (
          <GameResultModal
            isOpen={showSeriesResult}
            result={mySeriesResult}
            winnerName={seriesState.seriesWinner === mySymbol ? 'Tu' : opponent?.display_name}
            onClose={handleSeriesResultClose}
          />
        )}

      </div>
    </div>
  )
}
