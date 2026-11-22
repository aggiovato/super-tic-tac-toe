import type { GameState, Move } from '@super3t/core';

/** A legal move, the position it leads to and what it wins at once (decided by the engine). */
export interface MoveOutcome {
  readonly move: Move;
  readonly next: GameState;
  readonly winsBoard: boolean;
  readonly winsGame: boolean;
}
