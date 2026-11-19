import type { GameState, Move } from '@core';

/** A legal move, the position it leads to and what it wins at once (decided by the engine). */
export interface MoveOutcome {
  readonly move: Move;
  readonly next: GameState;
  readonly winsBoard: boolean;
  readonly winsGame: boolean;
}
