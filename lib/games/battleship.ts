export type BattleshipCell = '~' | 'A' | 'B' | 'C' | 'S' | 'P'

export type BattleshipBoard = BattleshipCell[][]

export const DEFAULT_FLEET = [
  { name: 'Porta-aviões', code: 'A', size: 5 },
  { name: 'Couraçado', code: 'B', size: 4 },
  { name: 'Cruzador', code: 'C', size: 3 },
  { name: 'Submarino', code: 'S', size: 3 },
  { name: 'Patrulha', code: 'P', size: 2 }
] as const

export type FleetPlacement = {
  ocean: BattleshipBoard
  ships: Array<{
    name: string
    code: BattleshipCell
    cells: Array<{ row: number; col: number }>
  }>
}

export function createEmptyBoard(size: number): BattleshipBoard {
  return Array.from({ length: size }, () => Array(size).fill('~')) as BattleshipBoard
}

export function autoPlaceFleet(size = 10): FleetPlacement {
  const ocean = createEmptyBoard(size)
  const ships: FleetPlacement['ships'] = []

  for (const ship of DEFAULT_FLEET) {
    let placed = false
    let attempts = 0

    while (!placed && attempts < 80) {
      attempts++
      const horizontal = Math.random() > 0.5
      const maxRow = horizontal ? size : size - ship.size
      const maxCol = horizontal ? size - ship.size : size
      const row = Math.floor(Math.random() * maxRow)
      const col = Math.floor(Math.random() * maxCol)

      if (canPlaceShip(ocean, row, col, ship.size, horizontal)) {
        const cells: Array<{ row: number; col: number }> = []
        for (let i = 0; i < ship.size; i++) {
          const r = row + (horizontal ? 0 : i)
          const c = col + (horizontal ? i : 0)
          ocean[r][c] = ship.code as BattleshipCell
          cells.push({ row: r, col: c })
        }
        ships.push({ name: ship.name, code: ship.code as BattleshipCell, cells })
        placed = true
      }
    }
  }

  return { ocean, ships }
}

function canPlaceShip(board: BattleshipBoard, row: number, col: number, size: number, horizontal: boolean) {
  for (let i = 0; i < size; i++) {
    const r = row + (horizontal ? 0 : i)
    const c = col + (horizontal ? i : 0)
    if (!board[r] || board[r][c] !== '~') {
      return false
    }
  }
  return true
}

export function toggleTargetCell(current: string): 'hit' | 'miss' | 'pending' {
  if (current === 'pending') return 'hit'
  if (current === 'hit') return 'miss'
  return 'pending'
}
