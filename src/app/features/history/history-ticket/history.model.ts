import type { ComputerLevel } from '@catalog';

/**
 * How a finished game ended for the person on this device: against the computer, won, drawn or
 * lost; a game between two people on the device has no side to see it from (`people`).
 */
export type Outcome = 'won' | 'drawn' | 'lost' | 'people';

/** Results against one computer level. */
export interface LevelStats {
  readonly level: ComputerLevel;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  /** The latest games against it, oldest first (at most `FORM_GAMES`). */
  readonly form: readonly Outcome[];
}

/** Results on one board size, so 3×3 and 5×5 never share a row. */
export interface VariantStats {
  readonly variant: string;
  readonly levels: readonly LevelStats[];
  /** Games two people finished on this device. */
  readonly people: number;
}

/** Wins, draws and losses against the computer, every level and size together. */
export interface Totals {
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
}

/** A finished game, as the history reads it. */
export interface HistoryEntry {
  readonly id: string;
  readonly variant: string;
  readonly outcome: Outcome;
  /** The participant who won, or null on a draw. */
  readonly winner: 0 | 1 | null;
  /** The winner's symbol, or null on a draw. */
  readonly winnerMark: 'x' | 'o' | null;
  readonly moves: number;
  readonly finishedAt: number;
}

/** Everything the history shows, in no language yet. */
export interface HistoryStats {
  readonly finished: number;
  readonly totals: Totals;
  readonly variants: readonly VariantStats[];
  /** The latest games, newest first (at most `RECENT_GAMES`). */
  readonly recent: readonly HistoryEntry[];
  /** The latest games' lengths, oldest first (at most `LENGTH_GAMES`). */
  readonly lengths: readonly HistoryEntry[];
}
