'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMatchmaking } from '@/hooks/useMatchmaking'
import { useBattleshipBoards } from '@/hooks/useBattleshipBoards'
import { ModeSelection } from '@/components/battleship/ModeSelection'
import { MatchmakingView } from '@/components/battleship/MatchmakingView'
import { PlacementBoard } from '@/components/battleship/PlacementBoard'
import { BattleBoard } from '@/components/battleship/BattleBoard'
import { useAuth } from '@/components/AuthProvider'
import { useSound } from '@/hooks/useSound'
import type { Json } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Sound Hook
  const { playSound, isMuted, toggleMute } = useSound()

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
      // Wrap in setTimeout to avoid synchronous state update warning
      setTimeout(() => {
        setViewMode('placement')
        resetFleet() // Ensure clean slate
        playSound('start')
      }, 0)
    }
  }, [status, viewMode, resetFleet, playSound])

  // 2. Handle Phase Change (Placement -> Battle)
  useEffect(() => {
    if (status === 'matched' && phase === 'battle' && viewMode === 'placement') {
      setTimeout(() => {
        setViewMode('battle')
        playSound('start')
      }, 0)
    }
  }, [status, phase, viewMode, playSound])

  // 3. Sync Opponent Moves (Battle Phase)
  useEffect(() => {
    if (status === 'matched' && phase === 'battle' && roomState.lastMove) {
      const { row, col, result, by } = roomState.lastMove

      if (by === myId) {
        // I made the move, ensure my target board reflects it
        markTargetResult(row, col, result)
        playSound(result === 'hit' ? 'hit' : 'miss')
      } else {
        // Opponent made the move, update my ocean
        receiveAttack(row, col)
        playSound(result === 'hit' ? 'hit' : 'miss') // Maybe different sound for receiving damage?
      }
    }
  }, [roomState.lastMove, status, phase, myId, markTargetResult, receiveAttack, playSound])

  // --- Handlers ---

  const handleSelectMode = (mode: 'local' | 'online') => {
    playSound('click')
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
    playSound('click')
    joinQueue({ mode: 'public' })
  }

  const handleCreatePrivate = (code: string) => {
    playSound('click')
    joinQueue({ mode: 'private', matchCode: code, seat: 'host' })
  }

  const handleJoinPrivate = (code: string) => {
    playSound('click')
    joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })
  }

  const handleCancelMatchmaking = () => {
    playSound('click')
    leaveQueue()
    setViewMode('selection')
  }

  const handleConfirmPlacement = async () => {
    playSound('click')
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

      playSound('shoot')

      // Check hit on defender's ocean
      const isHit = defender.ocean[row][col] !== '~'
      const result = isHit ? 'hit' : 'miss'

      // Update attacker's target board
      attacker.markTargetResult(row, col, result)

      // Update defender's incoming attacks (so they see it on their board)
      defender.receiveAttack(row, col)

      // Play result sound slightly delayed
      setTimeout(() => {
        playSound(result === 'hit' ? 'hit' : 'miss')
      }, 200)

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
    playSound('shoot')

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
    playSound('start')
    if (nextLocalPhase) {
      setLocalPhase(nextLocalPhase)
      setNextLocalPhase(null)
    }
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">

        {/* Header / Controls */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setViewMode('selection')}
            className={`text-sm font-bold tracking-wider text-slate-400 hover:text-white transition-colors ${viewMode === 'selection' ? 'invisible' : ''}`}
          >
            ← VOLTAR
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ModeSelection onSelectMode={handleSelectMode} playSound={playSound} />
            </motion.div>
          )}

          {viewMode === 'matchmaking' && (
            <motion.div
              key="matchmaking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <MatchmakingView
                onJoinPublic={handleJoinPublic}
                onCreatePrivate={handleCreatePrivate}
                onJoinPrivate={handleJoinPrivate}
                onCancel={handleCancelMatchmaking}
                status={status}
                roomCode={roomState.room_code}
                playSound={playSound}
              />
            </motion.div>
          )}

          {viewMode === 'placement' && localPhase !== 'transition' && (
            <motion.div
              key="placement"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PlacementBoard
                board={ocean}
                placedShips={playerFleet}
                onPlaceShip={(c, r, col, h) => {
                  placeShip(c, r, col, h)
                  playSound('place')
                }}
                onRemoveShip={(c) => {
                  removeShip(c)
                  playSound('click')
                }}
                onShuffle={() => {
                  shuffleFleet()
                  playSound('rotate')
                }}
                onReset={() => {
                  resetFleet()
                  playSound('click')
                }}
                onConfirm={handleConfirmPlacement}
                isComplete={isPlacementComplete}
                playSound={playSound}
              />
            </motion.div>
          )}

          {localPhase === 'transition' && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                <div className="text-8xl">🔄</div>
              </div>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6 text-center">
                TROCA DE TURNO
              </h2>
              <p className="text-xl text-slate-300 mb-12 text-center max-w-md leading-relaxed">
                {transitionMessage}
              </p>
              <button
                onClick={handleTransitionComplete}
                className="group relative px-8 py-4 bg-white text-black font-black text-lg tracking-wider uppercase hover:scale-105 transition-transform"
              >
                <div className="absolute inset-0 bg-blue-400 blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                <span className="relative z-10">Estou Pronto</span>
              </button>
            </motion.div>
          )}

          {viewMode === 'battle' && localPhase !== 'transition' && (
            <motion.div
              key="battle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
                      ? 'A TUA VEZ DE ATACAR'
                      : `AGUARDANDO ${opponent?.display_name?.toUpperCase() || 'ADVERSÁRIO'}...`
                }
                opponentName={gameMode === 'local' ? (localPhase === 'p1-turn' ? 'Jogador 2' : 'Jogador 1') : opponent?.display_name}
                playSound={playSound}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}