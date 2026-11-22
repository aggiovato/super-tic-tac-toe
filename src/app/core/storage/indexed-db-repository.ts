import type { GameId } from '@catalog';
import { readGameRecord } from './record-schema';
import { GameRepository, type StoredMatch, type StoredSeries } from './game-repository';
import { type GameRecord, SaveError, type SeriesRecord } from './records.model';

const DB_NAME = 'super-3t';
const DB_VERSION = 1;
const GAMES = 'games';
const SERIES = 'series';
/** Finished games by game and end time; unfinished ones (no end time) stay out of it. */
const FINISHED = 'finished';

/** A request's result, typed by the caller: the stores hold only this repository's records. */
const asPromise = <T>(request: IDBRequest): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

/** Why a write failed, from the browser's error. */
const failureOf = (error: unknown): SaveError =>
  error instanceof SaveError
    ? error
    : new SaveError(
        error instanceof DOMException && error.name === 'QuotaExceededError' ? 'quota' : 'failed',
        error,
      );

/** Games kept in this browser's IndexedDB (database `super-3t`). */
export class IndexedDbRepository extends GameRepository {
  readonly persistent = true;
  private db: Promise<IDBDatabase> | undefined;

  constructor(private readonly factory: IDBFactory) {
    super();
  }

  async load(gameId: GameId): Promise<StoredSeries | null> {
    const db = await this.open();
    const tx = db.transaction([SERIES, GAMES], 'readonly');
    const series = await asPromise<SeriesRecord | undefined>(tx.objectStore(SERIES).get(gameId));
    if (!series) {
      return null;
    }
    const game = await asPromise<GameRecord | undefined>(
      tx.objectStore(GAMES).get(series.currentGameId),
    );
    return { series, game: game ? readGameRecord(game) : null };
  }

  async save({ series, game, drop }: StoredMatch, expectedVersion: number): Promise<void> {
    const db = await this.open().catch((error: unknown) => {
      throw new SaveError('unavailable', error);
    });
    await new Promise<void>((resolve, reject) => {
      let failure: SaveError | undefined;
      const tx = db.transaction([SERIES, GAMES], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure ?? failureOf(tx.error));
      tx.onerror = () => undefined;
      const stored = tx.objectStore(SERIES).get(series.gameId);
      stored.onsuccess = () => {
        const previous = stored.result as SeriesRecord | undefined;
        if ((previous?.version ?? 0) !== expectedVersion) {
          failure = new SaveError('conflict');
          tx.abort();
          return;
        }
        if (drop) {
          this.dropIfUnfinished(tx, drop);
        }
        tx.objectStore(SERIES).put(series);
        tx.objectStore(GAMES).put(game);
      };
    });
  }

  /** Deletes a game the series left behind, unless it finished (finished games are history). */
  private dropIfUnfinished(tx: IDBTransaction, id: string): void {
    const games = tx.objectStore(GAMES);
    const left = games.get(id);
    left.onsuccess = () => {
      if ((left.result as GameRecord | undefined)?.finishedAt === null) {
        games.delete(id);
      }
    };
  }

  async finished(gameId: GameId): Promise<GameRecord[]> {
    const db = await this.open();
    const range = IDBKeyRange.bound([gameId, 0], [gameId, Number.MAX_SAFE_INTEGER]);
    const games = await asPromise<GameRecord[]>(
      db.transaction(GAMES, 'readonly').objectStore(GAMES).index(FINISHED).getAll(range),
    );
    return games.reverse().map(readGameRecord);
  }

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore(SERIES, { keyPath: 'gameId' });
        db.createObjectStore(GAMES, { keyPath: 'id' }).createIndex(FINISHED, [
          'gameId',
          'finishedAt',
        ]);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB is not available'));
    });
    // A failed open is not cached: a later call tries again.
    this.db.catch(() => (this.db = undefined));
    return this.db;
  }
}
