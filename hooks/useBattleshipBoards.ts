"use client"

import { useCallback, useMemo, useState } from 'react'
import { autoPlaceFleet, toggleTargetCell } from '@/lib/games/battleship'

const GRID_SIZE = 10

export type TargetCell = '' | 'pending' | 'hit' | 'miss'

function buildTargetBoard(): TargetCell[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('')) as TargetCell[][]
}

export function useBattleshipBoards() {
  const [placement, setPlacement] = useState(() => autoPlaceFleet(GRID_SIZE))
  const [targetBoard, setTargetBoard] = useState<TargetCell[][]>(() => buildTargetBoard())
  const [showShips, setShowShips] = useState(true)

  const playerFleet = useMemo(() => placement.ships, [placement])

  const shuffleFleet = useCallback(() => {
    setPlacement(autoPlaceFleet(GRID_SIZE))
  }, [])

  const handleTargetClick = useCallback((row: number, col: number) => {
    setTargetBoard(prev => {
      const snapshot = prev.map(line => [...line]) as TargetCell[][]
      const current = snapshot[row][col] || 'pending'
      snapshot[row][col] = toggleTargetCell(current)
      return snapshot
    })
  }, [])

  const resetTargets = useCallback(() => {
    setTargetBoard(buildTargetBoard())
  }, [])

  const toggleFleetVisibility = useCallback(() => {
    setShowShips(prev => !prev)
  }, [])

  return {
    ocean: placement.ocean,
    playerFleet,
    targetBoard,
    showShips,
    shuffleFleet,
    toggleFleetVisibility,
    setFleetVisibility: setShowShips,
    handleTargetClick,
    resetTargets
  }
}
