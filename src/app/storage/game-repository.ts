import type { GameId } from '@settings';
import type { GameRecord, SeriesRecord } from './records.model';

/** The current series of a game and the game on screen. */
export interface StoredMatch {
  readonly series: SeriesRecord;
  readonly game: GameRecord;
}

/**
 * Where games are kept on this device. `save` writes the series and its current game in one
 * transaction, only if the stored series is still at `expectedVersion` (0 when there is none);
 * otherwise it rejects with a `SaveError`.
 */
export abstract class GameRepository {
  abstract load(gameId: GameId): Promise<StoredMatch | null>;
  abstract save(match: StoredMatch, expectedVersion: number): Promise<void>;
  /** Finished games of `gameId`, newest first. */
  abstract finished(gameId: GameId): Promise<GameRecord[]>;
}
