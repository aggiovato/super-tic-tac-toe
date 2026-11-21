import type { GameId } from '@settings';
import type { GameRecord, SeriesRecord } from './records.model';

/** The current series of a game and the game on screen. */
export interface StoredMatch {
  readonly series: SeriesRecord;
  readonly game: GameRecord;
  /** A game the series left unfinished, deleted in the same transaction (it would never show). */
  readonly drop?: string;
}

/** What a load finds: the series, and its current game unless that record is missing. */
export interface StoredSeries {
  readonly series: SeriesRecord;
  readonly game: GameRecord | null;
}

/**
 * Where games are kept on this device. `save` writes the series and its current game in one
 * transaction, only if the stored series is still at `expectedVersion` (0 when there is none);
 * otherwise it rejects with a `SaveError`. A `drop` id is deleted in the same transaction unless
 * that game finished (finished games are history).
 */
export abstract class GameRepository {
  /** Whether games outlive this visit; the memory fallback does not. */
  abstract readonly persistent: boolean;
  abstract load(gameId: GameId): Promise<StoredSeries | null>;
  abstract save(match: StoredMatch, expectedVersion: number): Promise<void>;
  /** Finished games of `gameId`, newest first. */
  abstract finished(gameId: GameId): Promise<GameRecord[]>;
}
