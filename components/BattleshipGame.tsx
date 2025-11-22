'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useBattleshipBoards } from '@/hooks/useBattleshipBoards'
import { ModeSelection } from '@/components/battleship/ModeSelection'
import { MatchmakingView } from '@/components/battleship/MatchmakingView'
import { PlacementBoard } from '@/components/battleship/PlacementBoard'
import { BattleBoard } from '@/components/battleship/BattleBoard'
import { useAuth } from '@/components/AuthProvider'
import type { Json } from '@/lib/database.types'

type ViewMode = 'selection' | 'matchmaking' | 'placement' | 'battle'

type Participant = {
  id: string
  display_name?: string
  ready?: boolean
  fleet?: unknown
}

type RoomState = {
  participants?: Participant[]
  currentPlayer?: string
  phase?: string
  lastMove?: { row: number; col: number; result: 'hit' | 'miss'; by: string }
  room_code?: string
  board?: Record<string, unknown>
}

export default function BattleshipGame() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection')
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local')
  const [localPhase, setLocalPhase] = useState<'p1-setup' | 'p2-setup' | 'p1-turn' | 'p2-turn' | 'transition'>('p1-setup')
  const [nextLocalPhase, setNextLocalPhase] = useState<'p1-setup' | 'p2-setup' | 'p1-turn' | 'p2-turn' | null>(null)
  const [transitionMessage, setTransitionMessage] = useState('')
  const { user } = useAuth()
  
  const p1Boards = useBattleshipBoards()
  const p2Boards = useBattleshipBoards()

  // Determine which boards are currently active/visible
  const activeBoards = useMemo(() => {
    if (gameMode === 'online') return p1Boards
    // In local mode, show the board of the current player
    if (localPhase === 'p1-setup' || localPhase === 'p1-turn') return p1Boards
    if (localPhase === 'p2-setup' || localPhase === 'p2-turn') return p2Boards
    return p1Boards // Default during transition (hidden anyway)
  }, [gameMode, localPhase, p1Boards, p2Boards])

  const { 
    ocean, 
    playerFleet, 
    targetBoard, 
    placeShip, 
    removeShip, 
    shuffleFleet, 
    resetFleet,
    isPlacementComplete,
    handleTargetClick,
    markTargetResult,
    receiveAttack,
    incomingAttacks
  } = activeBoards

  const { status, room, joinQueue, leaveQueue, updateRoomState } = useMatchmaking('battleship')

  // --- Game State Management ---
  const roomState = useMemo(() => (room?.game_state as unknown as RoomState) || {}, [room?.game_state])
  const participants = roomState.participants || []
  const myId = user?.id
  const opponent = participants.find((p) => p.id !== myId)
  
  const isMyTurn = roomState.currentPlayer === myId
  const phase = roomState.phase || 'placement'

  // --- Effects ---

  // 1. Handle Match Found -> Go to Placement
  useEffect(() => {
    if (status === 'matched' && viewMode === 'matchmaking') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode('placement')
      resetFleet() // Ensure clean slate
    }
  }, [status, viewMode, resetFleet])

  // 2. Handle Phase Change (Placement -> Battle)
  useEffect(() => {
    if (status === 'matched' && phase === 'battle' && viewMode === 'placement') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode('battle')
    }
  }, [status, phase, viewMode])

  // 3. Sync Opponent Moves (Battle Phase)
  useEffect(() => {
    if (status === 'matched' && phase === 'battle' && roomState.lastMove) {
      const { row, col, result, by } = roomState.lastMove
      
      if (by === myId) {
        // I made the move, ensure my target board reflects it
        markTargetResult(row, col, result)
      } else {
        // Opponent made the move, update my ocean
        receiveAttack(row, col)
      }
    }
  }, [roomState.lastMove, status, phase, myId, markTargetResult, receiveAttack])

  // --- Handlers ---

  const handleSelectMode = (mode: 'local' | 'online') => {
    setGameMode(mode)
    if (mode === 'online') {
      setViewMode('matchmaking')
    } else {
      setViewMode('placement')
      setLocalPhase('p1-setup')
      p1Boards.resetFleet()
      p2Boards.resetFleet()
    }
  }

  const handleJoinPublic = () => {
    joinQueue({ mode: 'public' })
  }

  const handleCreatePrivate = (code: string) => {
    joinQueue({ mode: 'private', matchCode: code, seat: 'host' })
  }

  const handleJoinPrivate = (code: string) => {
    joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })
  }

  const handleCancelMatchmaking = () => {
    leaveQueue()
    setViewMode('selection')
  }

  const handleConfirmPlacement = async () => {
    if (gameMode === 'local') {
      if (localPhase === 'p1-setup') {
        setTransitionMessage('Passa o dispositivo ao Jogador 2 para posicionar a frota.')
        setNextLocalPhase('p2-setup')
        setLocalPhase('transition')
      } else if (localPhase === 'p2-setup') {
        setTransitionMessage('Tudo pronto! Passa o dispositivo ao Jogador 1 para começar a batalha.')
        setNextLocalPhase('p1-turn')
        setLocalPhase('transition')
        setViewMode('battle')
      }
      return
    }

    // Online: Signal ready
    if (!room) return

    await updateRoomState((current) => {
      const currentState = (current as unknown as RoomState) || {}
      const nextParticipants = currentState.participants?.map((p) => {
        if (p.id === myId) {
          return { ...p, ready: true, fleet: ocean } // Sharing fleet for validation
        }
        return p
      }) || []

      const allReady = nextParticipants.every((p) => p.ready) && nextParticipants.length === 2
      
      return {
        ...currentState,
        participants: nextParticipants,
        phase: allReady ? 'battle' : 'placement',
        currentPlayer: allReady ? nextParticipants[0].id : null, // Host starts?
        board: {}, // Could store shots here
      } as unknown as Json
    })
  }

  const handleBattleClick = async (row: number, col: number) => {
    if (gameMode === 'local') {
      // Determine current attacker and defender
      const isP1Turn = localPhase === 'p1-turn'
      const attacker = isP1Turn ? p1Boards : p2Boards
      const defender = isP1Turn ? p2Boards : p1Boards
      
      // Prevent double clicks
      if (attacker.targetBoard[row][col] !== '') return

      // Check hit on defender's ocean
      const isHit = defender.ocean[row][col] !== '~'
      const result = isHit ? 'hit' : 'miss'

      // Update attacker's target board
      attacker.markTargetResult(row, col, result)
      
      // Update defender's incoming attacks (so they see it on their board)
      defender.receiveAttack(row, col)

      // Wait a moment to show result, then switch turns
      setTimeout(() => {
        setTransitionMessage(`Fim do turno do Jogador ${isP1Turn ? '1' : '2'}. Passa o dispositivo ao Jogador ${isP1Turn ? '2' : '1'}.`)
        setNextLocalPhase(isP1Turn ? 'p2-turn' : 'p1-turn')
        setLocalPhase('transition')
      }, 1500)
      return
    }

    if (!isMyTurn || !room) return

    // Optimistic update
    handleTargetClick(row, col)

    // Send move to server
    await updateRoomState((current) => {
      const currentState = (current as unknown as RoomState) || {}
      // Check hit on opponent fleet
      const opponentFleet = (opponent?.fleet as Record<string, unknown> | undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isHit = (opponentFleet as any)?.[row]?.[col] !== '~'
      
      // Update history/board state
      // This is a simplified logic. Ideally we'd have a robust move validation.
      
      return {
        ...currentState,
        currentPlayer: opponent?.id, // Switch turn
        lastMove: { row, col, result: isHit ? 'hit' : 'miss', by: myId }
      } as unknown as Json
    })
  }

  const handleTransitionComplete = () => {
    if (nextLocalPhase) {
      setLocalPhase(nextLocalPhase)
      setNextLocalPhase(null)
    }
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

        {viewMode === 'placement' && localPhase !== 'transition' && (
          <PlacementBoard
            board={ocean}
            placedShips={playerFleet}
            onPlaceShip={placeShip}
            onRemoveShip={removeShip}
            onShuffle={shuffleFleet}
            onReset={resetFleet}
            onConfirm={handleConfirmPlacement}
            isComplete={isPlacementComplete}
          />
        )}

        {localPhase === 'transition' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-6">🔄</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center">
              Troca de Turno
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md">
              {transitionMessage}
            </p>
            <button
              onClick={handleTransitionComplete}
              className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
            >
              Estou Pronto
            </button>
          </div>
        )}

        {viewMode === 'battle' && localPhase !== 'transition' && (
          <BattleBoard
            myBoard={ocean}
            targetBoard={targetBoard}
            incomingAttacks={incomingAttacks}
            onTargetClick={handleBattleClick}
            isMyTurn={gameMode === 'local' ? true : isMyTurn}
            statusMessage={
              gameMode === 'local' 
                ? `Vez do Jogador ${localPhase === 'p1-turn' ? '1' : '2'}`
                : isMyTurn 
                  ? 'A tua vez de atacar!' 
                  : `Aguardando ${opponent?.display_name || 'adversário'}...`
            }
            opponentName={gameMode === 'local' ? (localPhase === 'p1-turn' ? 'Jogador 2' : 'Jogador 1') : opponent?.display_name}
          />
        )}

      </div>
    </div>
  )
}