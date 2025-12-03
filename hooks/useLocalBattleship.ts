'use client'

import { useCallback, useState, useMemo } from 'react'
import { useBattleshipBoards, type TargetCell } from './useBattleshipBoards'
import type { LocalGamePhase } from '@/lib/types/battleship'

interface UseLocalBattleshipReturn {
  /** Current phase of the local game */
  phase: LocalGamePhase
  /** Transition message to display between turns */
  transitionMessage: string
  /** Player 1's boards */
  p1Boards: ReturnType<typeof useBattleshipBoards>
  /** Player 2's boards */
  p2Boards: ReturnType<typeof useBattleshipBoards>
  /** Currently active boards based on phase */
  activeBoards: ReturnType<typeof useBattleshipBoards>
  /** Whether game is in transition state */
  isTransitioning: boolean
  /** Current player number (1 or 2) */
  currentPlayer: 1 | 2
  /** Winner (1, 2, or null if game ongoing) */
  winner: 1 | 2 | null
  /** Confirm placement and move to next phase */
  confirmPlacement: () => void
  /** Handle a battle click (attack) */
  handleBattleClick: (row: number, col: number) => void
  /** Complete the transition animation */
  completeTransition: () => void
  /** Reset the entire game */
  resetGame: () => void
}

/**
 * Hook for managing local (hotseat) battleship game
 * 
 * Handles:
 * - Turn management between two players on same device
 * - Phase transitions with privacy screens
 * - Win condition detection
 */
export function useLocalBattleship(): UseLocalBattleshipReturn {
  const [phase, setPhase] = useState<LocalGamePhase>('p1-setup')
  const [nextPhase, setNextPhase] = useState<LocalGamePhase | null>(null)
  const [transitionMessage, setTransitionMessage] = useState('')
  const [winner, setWinner] = useState<1 | 2 | null>(null)

  // Each player has their own board state
  const p1Boards = useBattleshipBoards()
  const p2Boards = useBattleshipBoards()

  const isTransitioning = phase === 'transition'
  
  const currentPlayer = useMemo((): 1 | 2 => {
    if (phase === 'p1-setup' || phase === 'p1-turn') return 1
    if (phase === 'p2-setup' || phase === 'p2-turn') return 2
    return 1 // Default during transition
  }, [phase])

  // Get the active boards based on current phase
  const activeBoards = useMemo(() => {
    if (phase === 'p1-setup' || phase === 'p1-turn') return p1Boards
    if (phase === 'p2-setup' || phase === 'p2-turn') return p2Boards
    return p1Boards // Default during transition
  }, [phase, p1Boards, p2Boards])

  /**
   * Check if a player has won (all opponent ships sunk)
   */
  const checkWinCondition = useCallback((
    attackerTargetBoard: TargetCell[][],
    defenderOcean: string[][]
  ): boolean => {
    // Count how many ship cells the defender has
    let totalShipCells = 0
    for (const row of defenderOcean) {
      for (const cell of row) {
        if (cell !== '~') {
          totalShipCells++
        }
      }
    }

    // Count hits on the target board
    let hitCount = 0
    for (const row of attackerTargetBoard) {
      for (const cell of row) {
        if (cell === 'hit') {
          hitCount++
        }
      }
    }

    return hitCount >= totalShipCells
  }, [])

  /**
   * Confirm ship placement and advance phase
   */
  const confirmPlacement = useCallback(() => {
    if (phase === 'p1-setup') {
      setTransitionMessage('Passa o dispositivo ao Jogador 2 para posicionar a frota.')
      setNextPhase('p2-setup')
      setPhase('transition')
    } else if (phase === 'p2-setup') {
      setTransitionMessage('Tudo pronto! Passa o dispositivo ao Jogador 1 para começar a batalha.')
      setNextPhase('p1-turn')
      setPhase('transition')
    }
  }, [phase])

  /**
   * Handle attack during battle phase
   */
  const handleBattleClick = useCallback((row: number, col: number) => {
    if (phase !== 'p1-turn' && phase !== 'p2-turn') return
    if (winner) return

    const isP1Turn = phase === 'p1-turn'
    const attacker = isP1Turn ? p1Boards : p2Boards
    const defender = isP1Turn ? p2Boards : p1Boards

    // Prevent double clicks on same cell
    if (attacker.targetBoard[row][col] !== '') return

    // Check if hit on defender's ocean
    const isHit = defender.ocean[row][col] !== '~'
    const result = isHit ? 'hit' : 'miss'

    // Update attacker's target board
    attacker.markTargetResult(row, col, result)

    // Update defender's incoming attacks display
    defender.receiveAttack(row, col)

    // Check win condition after a short delay to show the result
    setTimeout(() => {
      // Get updated target board
      const updatedTargetBoard = attacker.targetBoard.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? result : c))
      ) as TargetCell[][]

      if (checkWinCondition(updatedTargetBoard, defender.ocean)) {
        setWinner(isP1Turn ? 1 : 2)
        setPhase('finished')
        return
      }

      // Switch turns
      setTransitionMessage(
        `Fim do turno do Jogador ${isP1Turn ? '1' : '2'}. Passa o dispositivo ao Jogador ${isP1Turn ? '2' : '1'}.`
      )
      setNextPhase(isP1Turn ? 'p2-turn' : 'p1-turn')
      setPhase('transition')
    }, 1200)
  }, [phase, winner, p1Boards, p2Boards, checkWinCondition])

  /**
   * Complete transition and move to next phase
   */
  const completeTransition = useCallback(() => {
    if (nextPhase) {
      setPhase(nextPhase)
      setNextPhase(null)
      setTransitionMessage('')
    }
  }, [nextPhase])

  /**
   * Reset the entire game
   */
  const resetGame = useCallback(() => {
    setPhase('p1-setup')
    setNextPhase(null)
    setTransitionMessage('')
    setWinner(null)
    p1Boards.resetFleet()
    p1Boards.resetTargets()
    p2Boards.resetFleet()
    p2Boards.resetTargets()
  }, [p1Boards, p2Boards])

  return {
    phase,
    transitionMessage,
    p1Boards,
    p2Boards,
    activeBoards,
    isTransitioning,
    currentPlayer,
    winner,
    confirmPlacement,
    handleBattleClick,
    completeTransition,
    resetGame
  }
}
