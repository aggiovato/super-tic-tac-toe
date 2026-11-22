import { inject, Injectable, Injector } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import type { GameId } from '@catalog';
import { GameRepository, type StoredSeries } from '@storage';

/** A saved match read ahead: the series (or none), or the reason it could not be read. */
export type PreloadedMatch =
  { readonly ok: true; readonly stored: StoredSeries | null } | { readonly ok: false };

/**
 * Saved matches read before their route activates (`preloadMatch`), so a game's store starts with
 * its saved game on the first render: a page change then fades in the real board, not an empty one
 * that fills a moment later. Each read is taken once; without one the store reads as before.
 */
@Injectable({ providedIn: 'root' })
export class SavedMatches {
  // Asked for only when a route reads ahead, so a store without storage needs no repository.
  private readonly injector = inject(Injector);
  private readonly loaded = new Map<GameId, PreloadedMatch>();

  async preload(gameId: GameId): Promise<void> {
    try {
      const repository = this.injector.get(GameRepository);
      this.loaded.set(gameId, { ok: true, stored: await repository.load(gameId) });
    } catch {
      this.loaded.set(gameId, { ok: false });
    }
  }

  /** The read made for `gameId`'s route, once; undefined when there was none. */
  take(gameId: GameId): PreloadedMatch | undefined {
    const preloaded = this.loaded.get(gameId);
    this.loaded.delete(gameId);
    return preloaded;
  }
}

/** A game route's resolver: reads its saved match before the page renders. */
export const preloadMatch =
  (gameId: GameId): ResolveFn<boolean> =>
  async () => {
    await inject(SavedMatches).preload(gameId);
    return true;
  };
