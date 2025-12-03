/**
 * Battleship game types
 * 
 * Types for the multiplayer battleship game, including
 * secure game state that doesn't expose fleet positions.
 */

import type { Json } from '@/lib/database.types'

// Re-export from lib/games/battleship for convenience
export type { BattleshipCell, BattleshipBoard, FleetPlacement } from '@/lib/games/battleship'

export type TargetCell = '' | 'pending' | 'hit' | 'miss'

export type TargetBoard = TargetCell[][]

/** 
 * Ship definition with name, code and size 
 */
export interface ShipDefinition {
  name: string
  code: string
  size: number
}

/**
 * Placed ship with position information
 */
export interface PlacedShip {
  name: string
  code: string
  cells: Array<{ row: number; col: number }>
}

/**
 * Game phases
 */
export type BattleshipPhase = 'placement' | 'battle' | 'finished'

/**
 * View modes for the UI
 */
export type BattleshipViewMode = 'selection' | 'matchmaking' | 'placement' | 'battle'

/**
 * Local game phases (hotseat mode)
 */
export type LocalGamePhase = 
  | 'p1-setup' 
  | 'p2-setup' 
  | 'p1-turn' 
  | 'p2-turn' 
  | 'transition'
  | 'finished'

/**
 * Move result
 */
export interface BattleshipMove {
  row: number
  col: number
  result: 'hit' | 'miss'
  by: string
  timestamp: number
}

/**
 * Participant in online game
 * 
 * SECURITY: `fleetHash` is used instead of exposing actual fleet positions.
 * The hash is computed from the ocean grid and used to verify moves server-side.
 */
export interface BattleshipParticipant {
  id: string
  display_name?: string
  ready?: boolean
  /** 
   * Hash of the fleet positions - NOT the actual positions!
   * This prevents opponents from reading fleet positions from game_state.
   */
  fleetHash?: string
  /**
   * Hits received by this player (opponent's successful attacks)
   * Format: "row,col" strings
   */
  hitsReceived?: string[]
  /**
   * Whether all ships have been sunk
   */
  defeated?: boolean
}

/**
 * Secure room state for multiplayer battleship
 * 
 * IMPORTANT: This state is shared between players via Supabase Realtime.
 * Never store actual fleet positions here - only hashes!
 */
export interface BattleshipRoomState {
  participants: BattleshipParticipant[]
  currentPlayer?: string
  phase: BattleshipPhase
  lastMove?: BattleshipMove
  room_code?: string
  winner?: string
  /** Move history for replay/validation */
  moveHistory?: BattleshipMove[]
}

/**
 * Convert Json to BattleshipRoomState
 */
export function parseRoomState(json: Json | null): BattleshipRoomState {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return {
      participants: [],
      phase: 'placement'
    }
  }
  
  const obj = json as Record<string, unknown>
  
  return {
    participants: Array.isArray(obj.participants) 
      ? (obj.participants as BattleshipParticipant[])
      : [],
    currentPlayer: typeof obj.currentPlayer === 'string' ? obj.currentPlayer : undefined,
    phase: (obj.phase as BattleshipPhase) || 'placement',
    lastMove: obj.lastMove as BattleshipMove | undefined,
    room_code: typeof obj.room_code === 'string' ? obj.room_code : undefined,
    winner: typeof obj.winner === 'string' ? obj.winner : undefined,
    moveHistory: Array.isArray(obj.moveHistory) ? obj.moveHistory as BattleshipMove[] : undefined
  }
}

/**
 * Create a simple hash of the ocean grid for verification
 * This allows us to verify hits without exposing positions
 * 
 * @param ocean - The player's ocean grid
 * @returns A hash string that can be used to verify shots
 */
export function hashFleetPositions(ocean: string[][]): string {
  // Create a deterministic string representation
  const gridString = ocean.map(row => row.join('')).join('|')
  
  // Simple hash using djb2 algorithm
  let hash = 5381
  for (let i = 0; i < gridString.length; i++) {
    hash = ((hash << 5) + hash) + gridString.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Check if a shot hits a ship based on ocean grid
 * This is used locally - the ocean grid is never sent to opponents
 */
export function checkShot(ocean: string[][], row: number, col: number): 'hit' | 'miss' {
  if (!ocean[row] || ocean[row][col] === undefined) {
    return 'miss'
  }
  return ocean[row][col] !== '~' ? 'hit' : 'miss'
}

/**
 * Check if all ships are sunk
 */
export function checkAllShipsSunk(
  ocean: string[][], 
  hitsReceived: string[]
): boolean {
  // Count total ship cells
  let totalShipCells = 0
  for (const row of ocean) {
    for (const cell of row) {
      if (cell !== '~') {
        totalShipCells++
      }
    }
  }
  
  // Count hits on ship cells
  let hitShipCells = 0
  for (const hitStr of hitsReceived) {
    const [row, col] = hitStr.split(',').map(Number)
    if (ocean[row] && ocean[row][col] !== '~') {
      hitShipCells++
    }
  }
  
  return hitShipCells >= totalShipCells
}
