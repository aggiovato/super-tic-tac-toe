import type { GameId } from '@settings';
import { GameRepository, type StoredMatch } from './game-repository';
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

  load(gameId: GameId): Promise<StoredMatch | null> {
    const series = this.series.get(gameId);
    const game = series && this.games.get(series.currentGameId);
    return Promise.resolve(series && game ? { series, game } : null);
  }

  save({ series, game }: StoredMatch, expectedVersion: number): Promise<void> {
    if (this.failWith) {
      return Promise.reject(this.failWith);
    }
    if ((this.series.get(series.gameId)?.version ?? 0) !== expectedVersion) {
      return Promise.reject(new SaveError('conflict'));
    }
    this.series.set(series.gameId, series);
    this.games.set(game.id, game);
    return Promise.resolve();
  }

  finished(gameId: GameId): Promise<GameRecord[]> {
    return Promise.resolve(
      [...this.games.values()]
        .filter((game) => game.gameId === gameId && game.finishedAt !== null)
        .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)),
    );
  }
}
