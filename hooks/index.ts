/**
 * Hooks barrel export
 * 
 * Organized by domain:
 * - battleship: Battleship game specific hooks
 * - tictactoe: TicTacToe game specific hooks
 * - crossword: Crossword game specific hooks
 * - matchmaking: Multiplayer matchmaking hooks
 * - common: Shared utility hooks
 */

// Game-specific hooks
export * from './battleship'
export * from './tictactoe'
export * from './crossword'

// Matchmaking hooks
export * from './matchmaking'

// Common hooks
export * from './common'
