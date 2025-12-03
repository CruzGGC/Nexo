'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocalTicTacToe } from '@/hooks/useLocalTicTacToe'
import { useOnlineTicTacToe } from '@/hooks/useOnlineTicTacToe'
import { ModeSelection } from '@/components/tictactoe/ModeSelection'
import { MatchmakingView } from '@/components/tictactoe/MatchmakingView'
import { GameBoard } from '@/components/tictactoe/GameBoard'
import { GameResultModal } from '@/components/GameResultModal'

type ViewMode = 'selection' | 'matchmaking' | 'game'
type GameMode = 'local' | 'online'

// --- Sub-components for cleaner render ---

function BackgroundAmbience() {
  return (
    <>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-[128px] animate-pulse delay-1000" />
    </>
  )
}

interface SeriesBannerProps {
  mySymbol: 'X' | 'O' | null
  roundNumber: number
  xWins: number
  oWins: number
  opponentName?: string
}

function SeriesBanner({ mySymbol, roundNumber, xWins, oWins, opponentName }: SeriesBannerProps) {
  const myWins = mySymbol === 'X' ? xWins : oWins
  const oppWins = mySymbol === 'X' ? oWins : xWins
  
  return (
    <div className="mb-4 text-center">
      <div className="inline-block rounded-full bg-white/5 px-6 py-2 text-sm text-slate-300 border border-white/10">
        <span className="font-medium">Melhor de 5</span>
        <span className="mx-3 text-white/30">|</span>
        <span>Ronda {roundNumber}</span>
        <span className="mx-3 text-white/30">|</span>
        <span className={mySymbol === 'X' ? 'text-blue-400' : 'text-purple-400'}>
          Tu ({mySymbol}): {myWins}
        </span>
        <span className="mx-2">-</span>
        <span className={mySymbol === 'X' ? 'text-purple-400' : 'text-blue-400'}>
          {opponentName || 'Adversário'}: {oppWins}
        </span>
      </div>
    </div>
  )
}

// --- Main Component ---

export default function TicTacToeGame() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection')
  const [gameMode, setGameMode] = useState<GameMode>('local')

  // Hooks for each game mode
  const localGame = useLocalTicTacToe()
  const onlineGame = useOnlineTicTacToe()

  // Series result modal state
  const [showSeriesResult, setShowSeriesResult] = useState(false)
  const seriesResultCheckedRef = useRef(false)

  // --- Effects ---

  // Switch to game view when matched
  useEffect(() => {
    if (onlineGame.status === 'matched') {
      const timer = setTimeout(() => {
        setViewMode(prev => prev === 'matchmaking' ? 'game' : prev)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [onlineGame.status])

  // Show series result modal when online series completes
  useEffect(() => {
    if (gameMode === 'online' && onlineGame.seriesState.isSeriesComplete && !seriesResultCheckedRef.current) {
      seriesResultCheckedRef.current = true
      setShowSeriesResult(true)
    }
  }, [gameMode, onlineGame.seriesState.isSeriesComplete])
  
  // Reset series result check when series resets
  useEffect(() => {
    if (!onlineGame.seriesState.isSeriesComplete) {
      seriesResultCheckedRef.current = false
    }
  }, [onlineGame.seriesState.isSeriesComplete])

  // --- Handlers ---

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode)
    if (mode === 'online') {
      setViewMode('matchmaking')
    } else {
      setViewMode('game')
      localGame.handleReset()
    }
  }

  const handleJoinPublic = () => onlineGame.joinQueue({ mode: 'public' })
  const handleCreatePrivate = (code: string) => onlineGame.joinQueue({ mode: 'private', matchCode: code, seat: 'host' })
  const handleJoinPrivate = (code: string) => onlineGame.joinQueue({ mode: 'private', matchCode: code, seat: 'guest' })

  const handleCancelMatchmaking = () => {
    void onlineGame.resetMatch()
    setViewMode('selection')
  }
  
  const handleSeriesResultClose = () => {
    setShowSeriesResult(false)
    void onlineGame.resetMatch()
    setViewMode('selection')
  }

  const handleReset = async () => {
    if (gameMode === 'local') {
      localGame.handleReset()
    } else {
      await onlineGame.handleAdvanceRound()
    }
  }

  const handleCellClick = async (index: number) => {
    if (gameMode === 'local') {
      localGame.handleCellClick(index)
    } else {
      await onlineGame.handleCellClick(index)
    }
  }

  // --- Computed Values ---

  const activeGameState = gameMode === 'local' ? localGame.gameState : onlineGame.gameState
  
  const mySeriesResult = useMemo(() => {
    const { seriesWinner } = onlineGame.seriesState
    if (!seriesWinner) return 'draw'
    return onlineGame.mySymbol === seriesWinner ? 'victory' : 'defeat'
  }, [onlineGame.mySymbol, onlineGame.seriesState])

  // Build status message for online mode with initialization check
  const statusMessage = useMemo(() => {
    if (gameMode === 'local') {
      return localGame.gameState.statusMessage
    }
    return onlineGame.gameState.statusMessage
  }, [gameMode, localGame.gameState.statusMessage, onlineGame.gameState.statusMessage])

  // --- Render ---

  return (
    <div className="min-h-screen w-full bg-[#030014] relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundAmbience />

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
            status={onlineGame.status}
            roomCode={onlineGame.roomCode}
          />
        )}

        {viewMode === 'game' && (
          <>
            {/* Series info banner for online mode */}
            {gameMode === 'online' && (
              <SeriesBanner
                mySymbol={onlineGame.mySymbol}
                roundNumber={onlineGame.seriesState.roundNumber}
                xWins={onlineGame.seriesState.xWins}
                oWins={onlineGame.seriesState.oWins}
                opponentName={onlineGame.opponent?.display_name}
              />
            )}
            
            <GameBoard
              board={activeGameState.board}
              onCellClick={handleCellClick}
              currentPlayer={activeGameState.currentPlayer}
              isMyTurn={activeGameState.isMyTurn}
              winner={activeGameState.winner}
              winningLine={activeGameState.winningLine}
              isDraw={activeGameState.isDraw}
              onReset={handleReset}
              statusMessage={statusMessage}
              opponentName={
                gameMode === 'local'
                  ? (activeGameState.currentPlayer === 'X' ? 'Jogador O' : 'Jogador X')
                  : onlineGame.opponent?.display_name
              }
              score={activeGameState.score}
              gameMode={gameMode}
              resetLabel={
                gameMode === 'online' && (activeGameState.winner || activeGameState.isDraw)
                  ? 'Próxima Ronda'
                  : undefined
              }
            />
          </>
        )}
        
        {/* Series Result Modal */}
        {showSeriesResult && gameMode === 'online' && (
          <GameResultModal
            isOpen={showSeriesResult}
            result={mySeriesResult}
            winnerName={
              onlineGame.seriesState.seriesWinner === onlineGame.mySymbol 
                ? 'Tu' 
                : onlineGame.opponent?.display_name
            }
            onClose={handleSeriesResultClose}
          />
        )}
      </div>
    </div>
  )
}
