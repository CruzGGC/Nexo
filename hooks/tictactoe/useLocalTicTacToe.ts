/**
 * Hook for local TicTacToe game (hotseat mode)
 */
import { useState, useCallback } from 'react'
import type { 
  CellValue, 
  GameScore, 
  TicTacToeGameState 
} from '@/lib/types/tictactoe'
import { 
  checkWinner, 
  isBoardFull, 
  createEmptyBoard, 
  getNextPlayer 
} from '@/lib/types/tictactoe'

interface UseLocalTicTacToeReturn {
  gameState: TicTacToeGameState
  handleCellClick: (index: number) => void
  handleReset: () => void
  resetScores: () => void
}

export function useLocalTicTacToe(): UseLocalTicTacToeReturn {
  const [board, setBoard] = useState<CellValue[]>(createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<CellValue>('X')
  const [winner, setWinner] = useState<CellValue | null>(null)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [score, setScore] = useState<GameScore>({ x: 0, o: 0, draws: 0 })

  const handleCellClick = useCallback((index: number) => {
    // Can't click if cell is occupied or game is over
    if (board[index] || winner || isDraw) return

    const nextBoard = [...board]
    nextBoard[index] = currentPlayer

    const winResult = checkWinner(nextBoard)
    const nextWinner = winResult?.winner || null
    const nextWinningLine = winResult?.line || null
    const nextIsDraw = !nextWinner && isBoardFull(nextBoard)

    setBoard(nextBoard)
    setWinner(nextWinner)
    setWinningLine(nextWinningLine)
    setIsDraw(nextIsDraw)
    setCurrentPlayer(getNextPlayer(currentPlayer))

    // Update score
    if (nextWinner) {
      setScore(prev => ({
        ...prev,
        [nextWinner.toLowerCase()]: prev[nextWinner.toLowerCase() as 'x' | 'o'] + 1
      }))
    } else if (nextIsDraw) {
      setScore(prev => ({ ...prev, draws: prev.draws + 1 }))
    }
  }, [board, currentPlayer, winner, isDraw])

  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard())
    setCurrentPlayer('X')
    setWinner(null)
    setWinningLine(null)
    setIsDraw(false)
  }, [])

  const resetScores = useCallback(() => {
    setScore({ x: 0, o: 0, draws: 0 })
    handleReset()
  }, [handleReset])

  // Build status message
  const statusMessage = winner
    ? `Vencedor: Jogador ${winner}!`
    : isDraw
      ? 'Empate!'
      : `Vez do Jogador ${currentPlayer}`

  const gameState: TicTacToeGameState = {
    board,
    currentPlayer,
    winner,
    winningLine,
    isDraw,
    score,
    isMyTurn: true, // Always true in local mode (hotseat)
    statusMessage
  }

  return {
    gameState,
    handleCellClick,
    handleReset,
    resetScores
  }
}
