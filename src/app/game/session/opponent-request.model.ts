import type { Level } from '@ai';
import type { Move } from '@core';

/** What the opponent needs to reply: the game so far and how to play it. */
export interface OpponentRequest {
  /** Accepted moves in order; the opponent rebuilds the position from them. */
  readonly moves: readonly Move[];
  readonly level: Level;
  /** Integer seed kept for the whole game (see `chooseMove`). */
  readonly seed: number;
}
