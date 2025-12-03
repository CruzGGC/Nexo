/**
 * Type definitions barrel export
 * 
 * Note: Some types have the same name (e.g., parseRoomState).
 * Import from specific files when needed:
 * - import { parseRoomState } from '@/lib/types/battleship'
 * - import { parseRoomState } from '@/lib/types/tictactoe'
 */

// Export types directly to avoid naming conflicts
export type {
  TargetCell,
  TargetBoard,
  ShipDefinition,
  PlacedShip,
  BattleshipParticipant,
  BattleshipMove,
  BattleshipPhase,
  BattleshipRoomState,
} from './battleship'

export type {
  CellValue,
  TicTacToeViewMode,
  SeriesState,
  TicTacToeRoomState,
  GameScore,
  TicTacToeGameState,
} from './tictactoe'

export type {
  CrosswordCell,
  CrosswordClue,
} from './crossword'

export * from './games'

