import type { GameId, ComputerLevel } from '@catalog';

/**
 * Version of the stored records' shape; a change needs a migration (`record-schema.ts`). 2: who
 * played each side is a seat (version 1 kept a mode and a level).
 */
export const SCHEMA_VERSION = 2;

/** Who sits on a side: a person on this device, the computer player, or (online) a remote person. */
export type SeatKind = 'local' | 'computer' | 'remote';

/** One side of a game and who played it, as it was when the game was played. */
export interface Seat {
  readonly kind: SeatKind;
  /** The name the player chose for this side, if any (people only). */
  readonly name?: string;
  /** How strong the computer played (computer seats only). */
  readonly level?: ComputerLevel;
  /** The account that played this side, once there are accounts (phase 7). */
  readonly playerId?: string;
}

/** How a finished game ended, by participant (0 or 1), independent of the symbols. */
export type GameResult = 'won-0' | 'won-1' | 'draw';

/** One game, from its first move to its result. Its moves rebuild the position by replay. */
export interface GameRecord {
  readonly id: string;
  readonly gameId: GameId;
  readonly schemaVersion: number;
  readonly rulesVersion: number;
  /** The game's variant (a board size); absent in records of games with one shape. */
  readonly variant?: string;
  readonly seriesId: string;
  /** Participant 0 and 1: who played each side. */
  readonly seats: readonly [Seat, Seat];
  readonly seed: number;
  /** Participant playing X in this game. */
  readonly xPlayer: 0 | 1;
  readonly moves: readonly unknown[];
  readonly revision: number;
  /** Null while the game goes on; set once, so each game counts a single result. */
  readonly result: GameResult | null;
  readonly startedAt: number;
  readonly updatedAt: number;
  /** When it ended; only finished games appear in the history. */
  readonly finishedAt: number | null;
}

/** A game's current series: its score and the game on screen. One per game of the app. */
export interface SeriesRecord {
  readonly gameId: GameId;
  readonly seriesId: string;
  readonly currentGameId: string;
  readonly wins: readonly [number, number];
  readonly draws: number;
  /** Bumped by every save; a save expecting another version lost a race with another tab. */
  readonly version: number;
}

/** What went wrong with a save. */
export type SaveFailure = 'conflict' | 'quota' | 'unavailable' | 'failed';

export class SaveError extends Error {
  constructor(
    readonly failure: SaveFailure,
    cause?: unknown,
  ) {
    super(`The game could not be saved: ${failure}`, { cause });
  }
}
