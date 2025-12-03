/**
 * TicTacToe game types and utilities
 */

export type CellValue = 'X' | 'O' | null

export type TicTacToeViewMode = 'selection' | 'matchmaking' | 'game' | 'series-result'

export interface SeriesState {
  xWins: number
  oWins: number
  roundNumber: number
  isSeriesComplete: boolean
  seriesWinner?: 'X' | 'O' | null
}

export interface TicTacToeRoomState {
  board?: CellValue[]
  currentPlayer?: CellValue
  winner?: CellValue | null
  winningLine?: number[] | null
  isDraw?: boolean
  participants?: { id: string; display_name?: string }[]
  room_code?: string
  initialized?: boolean
  lastMoveBy?: string | null
  lastMoveAt?: number
  series?: SeriesState
}

export interface GameScore {
  x: number
  o: number
  draws: number
}

export interface TicTacToeGameState {
  board: CellValue[]
  currentPlayer: CellValue
  winner: CellValue | null
  winningLine: number[] | null
  isDraw: boolean
  score: GameScore
  isMyTurn: boolean
  statusMessage: string
}

// Win patterns for 3x3 grid
export const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
] as const

// Best of 5 series
export const SERIES_WINS_REQUIRED = 3

/**
 * Check for a winner on the board
 */
export function checkWinner(board: CellValue[]): { winner: CellValue; line: number[] } | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [...pattern] }
    }
  }
  return null
}

/**
 * Check if the board is full (draw if no winner)
 */
export function isBoardFull(board: CellValue[]): boolean {
  return board.every(cell => cell !== null)
}

/**
 * Create initial empty board
 */
export function createEmptyBoard(): CellValue[] {
  return Array(9).fill(null)
}

/**
 * Create initial series state
 */
export function createInitialSeries(): SeriesState {
  return {
    xWins: 0,
    oWins: 0,
    roundNumber: 1,
    isSeriesComplete: false,
    seriesWinner: null
  }
}

/**
 * Parse room state safely
 */
export function parseRoomState(gameState: unknown): TicTacToeRoomState {
  if (!gameState || typeof gameState !== 'object') {
    return {}
  }
  return gameState as TicTacToeRoomState
}

/**
 * Get the next player
 */
export function getNextPlayer(current: CellValue): CellValue {
  return current === 'X' ? 'O' : 'X'
}
