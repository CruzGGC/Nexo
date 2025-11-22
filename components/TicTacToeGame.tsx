'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useAuth } from '@/components/AuthProvider'
import { ModeSelection } from '@/components/tictactoe/ModeSelection'
import { MatchmakingView } from '@/components/tictactoe/MatchmakingView'
import { GameBoard } from '@/components/tictactoe/GameBoard'
import type { Json } from '@/lib/database.types'

type ViewMode = 'selection' | 'matchmaking' | 'game'
type CellValue = 'X' | 'O' | null

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
]

type RoomState = {
  board?: CellValue[]
  currentPlayer?: CellValue
  winner?: CellValue | null
  winningLine?: number[] | null
  isDraw?: boolean
  participants?: { id: string; display_name?: string }[]
  room_code?: string
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

  const { status, room, joinQueue, leaveQueue, updateRoomState } = useMatchmaking('tic_tac_toe')

  // --- Derived State ---
  const roomState = useMemo(() => (room?.game_state as unknown as RoomState) || {}, [room?.game_state])
  const participants = useMemo(() => roomState.participants || [], [roomState.participants])
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

  const isMyTurn = gameMode === 'local' ? true : activeCurrentPlayer === mySymbol

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

  useEffect(() => {
    if (status === 'matched' && participants.length > 0) {
      // Initialize online game state if host and not initialized
      if (participants[0]?.id === myId && !roomState.board) {
        updateRoomState(() => ({
          board: Array(9).fill(null),
          currentPlayer: 'X',
          winner: null,
          winningLine: null,
          isDraw: false
        } as unknown as Json))
      }
    }
  }, [status, participants, myId, updateRoomState, roomState.board])

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
    if (gameMode === 'online' && !isMyTurn) return

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
    } else {
      // Optimistic update not strictly needed for TTT but good for responsiveness
      // We'll just send to server
      await updateRoomState((current) => {
        const currentState = (current as unknown as RoomState) || {}
        return {
          ...currentState,
          board: nextBoard,
          currentPlayer: nextPlayer,
          winner: nextWinner,
          winningLine: nextWinningLine,
          isDraw: nextIsDraw
        } as unknown as Json
      })
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
      if (!room) return
      await updateRoomState((current) => {
        const currentState = (current as unknown as RoomState) || {}
        return {
          ...currentState,
          board: Array(9).fill(null),
          currentPlayer: 'X',
          winner: null,
          winningLine: null,
          isDraw: false
        } as unknown as Json
      })
    }
  }

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
    leaveQueue()
    setViewMode('selection')
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-black dark:text-white">
      <div className="mx-auto max-w-6xl">
        
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
              activeWinner 
                ? `Vencedor: ${activeWinner === 'X' ? 'Jogador X' : 'Jogador O'}!`
                : activeIsDraw
                  ? 'Empate!'
                  : gameMode === 'local'
                    ? `Vez do Jogador ${activeCurrentPlayer}`
                    : isMyTurn
                      ? 'A tua vez!'
                      : `Aguardando ${opponent?.display_name || 'adversário'}...`
            }
            opponentName={gameMode === 'local' ? (activeCurrentPlayer === 'X' ? 'Jogador O' : 'Jogador X') : opponent?.display_name}
          />
        )}

      </div>
    </div>
  )
}
