import type { Level } from './level.model';

export interface OpponentOptions {
  readonly level: Level;
  /**
   * Integer seed for the opponent's random choices, kept for the whole game: the same seed and
   * position always yield the same move.
   */
  readonly seed: number;
}
