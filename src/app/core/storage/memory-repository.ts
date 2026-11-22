import type { GameId } from '@catalog';
import { readGameRecord } from './record-schema';
import { GameRepository, type StoredMatch, type StoredSeries } from './game-repository';
import { type GameRecord, SaveError, type SeriesRecord } from './records.model';

/**
 * Games kept in memory for this visit: the fallback when the browser offers no IndexedDB, and the
 * repository of app tests. Same rules as the stored one: one transaction, a version check.
 */
export class MemoryRepository extends GameRepository {
  private readonly series = new Map<GameId, SeriesRecord>();
  private readonly games = new Map<string, GameRecord>();
  /** Set by tests to make the next saves fail. */
  failWith: SaveError | null = null;

  /** `persistent` lets a test stand in for the stored repository; the app's fallback is not. */
  constructor(readonly persistent = false) {
    super();
  }

  load(gameId: GameId): Promise<StoredSeries | null> {
    const series = this.series.get(gameId);
    return Promise.resolve(series ? { series, game: this.readGame(series.currentGameId) } : null);
  }

  private readGame(id: string): GameRecord | null {
    const game = this.games.get(id);
    return game ? readGameRecord(game) : null;
  }

  /** Whether a game record is kept, finished or not (for tests). */
  has(id: string): boolean {
    return this.games.has(id);
  }

  save({ series, game, drop }: StoredMatch, expectedVersion: number): Promise<void> {
    if (this.failWith) {
      return Promise.reject(this.failWith);
    }
    if ((this.series.get(series.gameId)?.version ?? 0) !== expectedVersion) {
      return Promise.reject(new SaveError('conflict'));
    }
    if (drop && this.games.get(drop)?.finishedAt === null) {
      this.games.delete(drop);
    }
    this.series.set(series.gameId, series);
    this.games.set(game.id, game);
    return Promise.resolve();
  }

  finished(gameId: GameId): Promise<GameRecord[]> {
    return Promise.resolve(
      [...this.games.values()]
        .map(readGameRecord)
        .filter((game) => game.gameId === gameId && game.finishedAt !== null)
        .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)),
    );
  }
}
