'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalBattleship } from '@/hooks/useLocalBattleship'
import { useOnlineBattleship } from '@/hooks/useOnlineBattleship'
import { ModeSelection } from '@/components/battleship/ModeSelection'
import { MatchmakingView } from '@/components/battleship/MatchmakingView'
import { PlacementBoard } from '@/components/battleship/PlacementBoard'
import { BattleBoard } from '@/components/battleship/BattleBoard'
import type { BattleshipViewMode } from '@/lib/types/battleship'

/**
 * Main Battleship Game Component
 * 
 * Orchestrates the game flow between:
 * - Mode selection (local vs online)
 * - Matchmaking (online only)
 * - Ship placement
 * - Battle phase
 * 
 * Uses separate hooks for local and online game logic.
 */
export default function BattleshipGame() {
  const [viewMode, setViewMode] = useState<BattleshipViewMode>('selection')
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local')

  // Local game hook
  const local = useLocalBattleship()

  // Online game hook
  const online = useOnlineBattleship()

  // Handle mode selection
  const handleSelectMode = useCallback((mode: 'local' | 'online') => {
    setGameMode(mode)
    if (mode === 'online') {
      setViewMode('matchmaking')
    } else {
      setViewMode('placement')
      local.resetGame()
    }
  }, [local])

  // Handle back button
  const handleBack = useCallback(() => {
    if (gameMode === 'online') {
      online.cancelMatchmaking()
    } else {
      local.resetGame()
    }
    setViewMode('selection')
  }, [gameMode, online, local])

  // Handle matchmaking success -> go to placement
  const handleMatchFound = useCallback(() => {
    if (online.status === 'matched') {
      setViewMode('placement')
      online.boards.resetFleet()
    }
  }, [online.status, online.boards])

  // Watch for match found
  if (online.status === 'matched' && viewMode === 'matchmaking') {
    // Use setTimeout to avoid synchronous state update
    setTimeout(handleMatchFound, 0)
  }

  // Watch for phase change to battle (online)
  if (online.status === 'matched' && online.phase === 'battle' && viewMode === 'placement') {
    setTimeout(() => setViewMode('battle'), 0)
  }

  // Watch for local phase transition to battle
  if (gameMode === 'local' && 
      (local.phase === 'p1-turn' || local.phase === 'p2-turn') && 
      viewMode === 'placement') {
    setTimeout(() => setViewMode('battle'), 0)
  }

  // Get current active boards based on mode and phase
  const getCurrentBoards = () => {
    if (gameMode === 'online') {
      return online.boards
    }
    return local.activeBoards
  }

  const boards = getCurrentBoards()

  // Handle placement confirmation
  const handleConfirmPlacement = useCallback(async () => {
    if (gameMode === 'local') {
      local.confirmPlacement()
    } else {
      await online.confirmPlacement()
    }
  }, [gameMode, local, online])

  // Handle battle click
  const handleBattleClick = useCallback(async (row: number, col: number) => {
    if (gameMode === 'local') {
      local.handleBattleClick(row, col)
    } else {
      await online.handleAttack(row, col)
    }
  }, [gameMode, local, online])

  // Get status message for battle
  const getStatusMessage = (): string => {
    if (gameMode === 'local') {
      if (local.winner) {
        return `🎉 JOGADOR ${local.winner} VENCEU!`
      }
      return `Vez do Jogador ${local.currentPlayer}`
    } else {
      if (online.winner) {
        return online.winner === online.myId 
          ? '🎉 VITÓRIA!' 
          : '💀 DERROTA...'
      }
      return online.isMyTurn
        ? 'A TUA VEZ DE ATACAR'
        : `AGUARDANDO ${online.opponent?.display_name?.toUpperCase() || 'ADVERSÁRIO'}...`
    }
  }

  // Get opponent name
  const getOpponentName = (): string => {
    if (gameMode === 'local') {
      return local.currentPlayer === 1 ? 'Jogador 2' : 'Jogador 1'
    }
    return online.opponent?.display_name || 'Adversário'
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden relative selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <BackgroundAmbience showGrid={viewMode !== 'battle'} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        {/* Header / Controls */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBack}
            className={`text-sm font-bold tracking-wider text-slate-400 hover:text-white transition-colors ${viewMode === 'selection' ? 'invisible' : ''}`}
          >
            ← VOLTAR
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Mode Selection */}
          {viewMode === 'selection' && (
            <FadeIn key="selection">
              <ModeSelection onSelectMode={handleSelectMode} />
            </FadeIn>
          )}

          {/* Matchmaking (Online only) */}
          {viewMode === 'matchmaking' && (
            <ScaleIn key="matchmaking">
              <MatchmakingView
                onJoinPublic={online.joinPublic}
                onCreatePrivate={online.createPrivate}
                onJoinPrivate={online.joinPrivate}
                onCancel={online.cancelMatchmaking}
                status={online.status}
                roomCode={online.roomCode}
              />
            </ScaleIn>
          )}

          {/* Ship Placement */}
          {viewMode === 'placement' && !local.isTransitioning && (
            <FadeIn key="placement">
              <PlacementBoard
                board={boards.ocean}
                placedShips={boards.playerFleet}
                onPlaceShip={(code, row, col, horizontal) => {
                  boards.placeShip(code, row, col, horizontal)
                }}
                onRemoveShip={(code) => {
                  boards.removeShip(code)
                }}
                onShuffle={() => {
                  boards.shuffleFleet()
                }}
                onReset={() => {
                  boards.resetFleet()
                }}
                onConfirm={handleConfirmPlacement}
                isComplete={boards.isPlacementComplete}
              />
              {/* Show current player in local mode */}
              {gameMode === 'local' && (
                <div className="text-center mt-4 text-lg text-slate-400">
                  Jogador {local.currentPlayer} - Posiciona a tua frota
                </div>
              )}
            </FadeIn>
          )}

          {/* Turn Transition Screen (Local only) */}
          {local.isTransitioning && gameMode === 'local' && (
            <TransitionScreen
              message={local.transitionMessage}
              onContinue={local.completeTransition}
            />
          )}

          {/* Battle Phase */}
          {viewMode === 'battle' && !local.isTransitioning && (
            <FadeIn key="battle">
              <BattleBoard
                myBoard={boards.ocean}
                targetBoard={boards.targetBoard}
                incomingAttacks={boards.incomingAttacks}
                onTargetClick={handleBattleClick}
                isMyTurn={gameMode === 'local' ? true : online.isMyTurn}
                statusMessage={getStatusMessage()}
                opponentName={getOpponentName()}
              />
              {/* Winner overlay */}
              {(local.winner || online.winner) && (
                <WinnerOverlay
                  isWinner={gameMode === 'local' 
                    ? true // Both players see "winner" in local
                    : online.winner === online.myId
                  }
                  onPlayAgain={() => {
                    if (gameMode === 'local') {
                      local.resetGame()
                      setViewMode('placement')
                    } else {
                      online.resetMatch()
                      setViewMode('selection')
                    }
                  }}
                />
              )}
            </FadeIn>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// --- Sub-components ---

function BackgroundAmbience({ showGrid }: { showGrid: boolean }) {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow delay-1000" />
      {showGrid && (
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      )}
    </div>
  )
}

function FadeIn({ children, key }: { children: React.ReactNode; key: string }) {
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

function ScaleIn({ children, key }: { children: React.ReactNode; key: string }) {
  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

function TransitionScreen({ 
  message, 
  onContinue 
}: { 
  message: string
  onContinue: () => void 
}) {
  return (
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
        {message}
      </p>
      <button
        onClick={onContinue}
        className="group relative px-8 py-4 bg-white text-black font-black text-lg tracking-wider uppercase hover:scale-105 transition-transform"
      >
        <div className="absolute inset-0 bg-blue-400 blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
        <span className="relative z-10">Estou Pronto</span>
      </button>
    </motion.div>
  )
}

function WinnerOverlay({ 
  isWinner, 
  onPlayAgain 
}: { 
  isWinner: boolean
  onPlayAgain: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="text-center">
        <div className="text-8xl mb-6">
          {isWinner ? '🏆' : '💀'}
        </div>
        <h2 className={`text-5xl font-black mb-8 ${
          isWinner 
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500'
            : 'text-slate-400'
        }`}>
          {isWinner ? 'VITÓRIA!' : 'DERROTA'}
        </h2>
        <button
          onClick={onPlayAgain}
          className="px-8 py-4 bg-white text-black font-bold text-lg uppercase hover:scale-105 transition-transform"
        >
          Jogar Novamente
        </button>
      </div>
    </motion.div>
  )
}
