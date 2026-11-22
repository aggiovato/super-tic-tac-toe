import type { Level } from './level.model';

export interface ComputerOptions {
  readonly level: Level;
  /**
   * Integer seed for the opponent's random choices, kept for the whole game: the same seed and
   * position always yield the same move.
   */
  readonly seed: number;
  /**
   * Monotonic clock in milliseconds; `performance.now` by default. Tests pass their own to spend the
   * budget on purpose (budgets themselves are checked by counting engine calls, never by time).
   */
  readonly now?: () => number;
}
