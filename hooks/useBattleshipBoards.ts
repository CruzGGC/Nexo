"use client"

import { useCallback, useMemo, useState } from 'react'
import { autoPlaceFleet, toggleTargetCell, createEmptyBoard, canPlaceShip, DEFAULT_FLEET, BattleshipCell, FleetPlacement } from '@/lib/games/battleship'

const GRID_SIZE = 10

export type TargetCell = '' | 'pending' | 'hit' | 'miss'

function buildTargetBoard(): TargetCell[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('')) as TargetCell[][]
}

export function useBattleshipBoards() {
  // Initialize with empty board instead of auto-placed
  const [placement, setPlacement] = useState<FleetPlacement>(() => ({
    ocean: createEmptyBoard(GRID_SIZE),
    ships: []
  }))
  const [targetBoard, setTargetBoard] = useState<TargetCell[][]>(() => buildTargetBoard())
  const [showShips, setShowShips] = useState(true)
  const [incomingAttacks, setIncomingAttacks] = useState<TargetCell[][]>(() => buildTargetBoard())

  const playerFleet = useMemo(() => placement.ships, [placement])

  const shuffleFleet = useCallback(() => {
    setPlacement(autoPlaceFleet(GRID_SIZE))
  }, [])

  const resetFleet = useCallback(() => {
    setPlacement({
      ocean: createEmptyBoard(GRID_SIZE),
      ships: []
    })
  }, [])

  const placeShip = useCallback((shipCode: BattleshipCell, row: number, col: number, horizontal: boolean) => {
    setPlacement(prev => {
      const shipDef = DEFAULT_FLEET.find(s => s.code === shipCode)
      if (!shipDef) return prev

      // Create deep copy of ocean
      const newOcean = prev.ocean.map(r => [...r])
      
      // Remove existing ship if present (to allow moving it)
      const existingShipIndex = prev.ships.findIndex(s => s.code === shipCode)
      if (existingShipIndex >= 0) {
        const existingShip = prev.ships[existingShipIndex]
        existingShip.cells.forEach(cell => {
          newOcean[cell.row][cell.col] = '~'
        })
      }

      // Check if placement is valid (ignoring the ship we just removed)
      if (!canPlaceShip(newOcean, row, col, shipDef.size, horizontal)) {
        return prev // Invalid placement
      }

      // Place new ship
      const newCells: {row: number, col: number}[] = []
      for (let i = 0; i < shipDef.size; i++) {
        const r = row + (horizontal ? 0 : i)
        const c = col + (horizontal ? i : 0)
        newOcean[r][c] = shipCode
        newCells.push({ row: r, col: c })
      }

      const newShips = [...prev.ships]
      if (existingShipIndex >= 0) {
        newShips.splice(existingShipIndex, 1)
      }
      newShips.push({
        name: shipDef.name,
        code: shipCode,
        cells: newCells
      })

      return {
        ocean: newOcean,
        ships: newShips
      }
    })
  }, [])

  const removeShip = useCallback((shipCode: BattleshipCell) => {
    setPlacement(prev => {
      const existingShipIndex = prev.ships.findIndex(s => s.code === shipCode)
      if (existingShipIndex === -1) return prev

      const newOcean = prev.ocean.map(r => [...r])
      const existingShip = prev.ships[existingShipIndex]
      existingShip.cells.forEach(cell => {
        newOcean[cell.row][cell.col] = '~'
      })

      const newShips = [...prev.ships]
      newShips.splice(existingShipIndex, 1)

      return {
        ocean: newOcean,
        ships: newShips
      }
    })
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

  const isPlacementComplete = useMemo(() => {
    return placement.ships.length === DEFAULT_FLEET.length
  }, [placement])

  const receiveAttack = useCallback((row: number, col: number) => {
    const isShip = placement.ocean[row][col] !== '~'
    setIncomingAttacks(prev => {
      const snapshot = prev.map(line => [...line]) as TargetCell[][]
      snapshot[row][col] = isShip ? 'hit' : 'miss'
      return snapshot
    })
  }, [placement.ocean])

  const markTargetResult = useCallback((row: number, col: number, result: 'hit' | 'miss') => {
    setTargetBoard(prev => {
      const snapshot = prev.map(line => [...line]) as TargetCell[][]
      snapshot[row][col] = result
      return snapshot
    })
  }, [])

  return {
    ocean: placement.ocean,
    playerFleet,
    targetBoard,
    incomingAttacks,
    showShips,
    shuffleFleet,
    resetFleet,
    placeShip,
    removeShip,
    isPlacementComplete,
    toggleFleetVisibility,
    setFleetVisibility: setShowShips,
    handleTargetClick,
    markTargetResult,
    receiveAttack,
    resetTargets
  }
}

