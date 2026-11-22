import {
  effect,
  inject,
  InjectionToken,
  Injector,
  type Provider,
  type Signal,
  untracked,
} from '@angular/core';
import { patchState } from '@ngrx/signals';
import { type GameId, type PlaySetup, Preferences } from '@settings';
import {
  type GameRecord,
  type GameResult,
  GameRepository,
  SaveError,
  SCHEMA_VERSION,
  type StoredMatch,
  type StoredSeries,
} from '@storage';
import type {
  MatchGame,
  MatchRules,
  MatchState,
  Mode,
  Participant,
  SaveStatus,
} from './match.model';
import { type MatchTurnsStore, newId } from './match-turns';

/** Which game a route's match is saved as. Routes without it (a challenge) save nothing. */
export const MATCH_STORAGE = new InjectionToken<{ readonly gameId: GameId }>('MATCH_STORAGE');

/** Saves this route's match as `gameId` and restores it on the next visit. */
export function provideMatchStorage(gameId: GameId): Provider {
  return { provide: MATCH_STORAGE, useValue: { gameId } };
}

/** What saving and restoring read and write on the store. */
export interface MatchStorageStore<S, M, R> extends MatchTurnsStore<S, M, R> {
  readonly id: Signal<string>;
  readonly seriesId: Signal<string>;
  readonly startedAt: Signal<number>;
  readonly mode: Signal<Mode>;
  readonly saveStatus: Signal<SaveStatus>;
  readonly _requestOpponent: () => void;
  readonly _startGame: (changes: Partial<MatchState<S, R>>) => void;
}

/** A finished game's result by participant, independent of the symbols. */
function resultOf(game: MatchGame<unknown>, xPlayer: Participant): GameResult | null {
  if (game.status.kind === 'drawn') {
    return 'draw';
  }
  if (game.status.kind !== 'won') {
    return null;
  }
  const winner: Participant = game.status.winner === 'X' ? xPlayer : xPlayer === 0 ? 1 : 0;
  return winner === 0 ? 'won-0' : 'won-1';
}

/** What saving remembers between saves: the stored version and when the current game ended. */
interface StorageMemory {
  version: number;
  finished: { id: string; at: number | null };
  /** The game this tab last saved or restored, if it was unfinished: dropped once left behind. */
  unfinished: string | null;
}

/** The series and current game as they stand on the store, ready to save. */
function recordOf<S extends MatchGame<M>, M, R>(
  store: MatchStorageStore<S, M, R>,
  gameId: GameId,
  memory: StorageMemory,
): StoredMatch {
  const game = store.position();
  const id = store.id();
  const result = resultOf(game, store.xPlayer());
  if (memory.finished.id !== id) {
    memory.finished = { id, at: null };
  }
  memory.finished.at ??= result ? Date.now() : null;
  const saved: GameRecord = {
    id,
    gameId,
    schemaVersion: SCHEMA_VERSION,
    rulesVersion: game.rulesVersion,
    variant: store.variant(),
    seriesId: store.seriesId(),
    mode: store.mode(),
    level: store.level(),
    seed: store.seed(),
    xPlayer: store.xPlayer(),
    moves: game.moves,
    revision: game.moves.length,
    result,
    startedAt: store.startedAt(),
    updatedAt: Date.now(),
    finishedAt: memory.finished.at,
  };
  const series = {
    gameId,
    seriesId: store.seriesId(),
    currentGameId: id,
    wins: store.wins(),
    draws: store.draws(),
    version: memory.version + 1,
  };
  const left = memory.unfinished;
  return { series, game: saved, ...(left && left !== id ? { drop: left } : {}) };
}

/** A record's position, or null when it cannot be read: unknown schema, refused or damaged moves. */
function replayRecord<S, M>(rules: MatchRules<S, M>, game: GameRecord) {
  if (game.schemaVersion !== SCHEMA_VERSION) {
    return null;
  }
  try {
    return rules.replay(game.moves as readonly M[], game.rulesVersion, game.variant ?? '');
  } catch {
    // Moves that are not moves (a damaged record) make the engine throw.
    return null;
  }
}

/** Puts a stored match back on the board; false when its record cannot be read. */
function restoreMatch<S extends MatchGame<M>, M, R>(
  store: MatchStorageStore<S, M, R>,
  rules: MatchRules<S, M>,
  { series, game }: StoredMatch,
  memory: StorageMemory,
): boolean {
  const replayed = replayRecord(rules, game);
  if (!replayed?.ok || !replayed.state) {
    return false;
  }
  memory.finished = { id: game.id, at: game.finishedAt };
  memory.unfinished = game.result === null ? game.id : null;
  patchState(store, {
    game: replayed.state,
    variant: game.variant ?? '',
    mode: game.mode,
    level: game.level,
    seed: game.seed,
    xPlayer: game.xPlayer,
    wins: series.wins,
    draws: series.draws,
    id: game.id,
    seriesId: series.seriesId,
    startedAt: game.startedAt,
    scored: game.result !== null,
    lastRejection: null,
  });
  return true;
}

/** A first game of the saved setup (mode, level and variant), in a new series. */
function startSetup<S, M, R>(
  store: MatchStorageStore<S, M, R>,
  { mode, level, variant = '' }: PlaySetup,
): void {
  store._startGame({ seriesId: newId(), mode, level, variant, xPlayer: 0, wins: [0, 0], draws: 0 });
}

/**
 * Saving and restoring a match. On start it loads the game's series and its current game, replays
 * the moves (an unreadable record is kept and a new game starts) and asks the opponent once if it
 * is its turn. After that every change is saved, in order, with the series' version: a save that
 * lost a race with another tab stops saving here (`conflict`); others can be retried.
 */
export function matchStorage<S extends MatchGame<M>, M, R>(
  store: MatchStorageStore<S, M, R>,
  rules: MatchRules<S, M>,
) {
  const config = inject(MATCH_STORAGE, { optional: true });
  const repository = config ? inject(GameRepository) : null;
  const preferences = inject(Preferences);
  const injector = inject(Injector);
  // An unreadable record is never `unfinished` here, so it is kept, never dropped.
  const memory: StorageMemory = { version: 0, finished: { id: '', at: null }, unfinished: null };
  let queue = Promise.resolve();
  let stopped = false;

  const save = (): void => {
    if (!config || !repository) {
      return;
    }
    queue = queue.then(async () => {
      if (stopped) {
        return;
      }
      patchState(store, { saveStatus: 'saving' });
      try {
        const match = recordOf(store, config.gameId, memory);
        await repository.save(match, memory.version);
        memory.version = match.series.version;
        memory.unfinished = match.game.result === null ? match.game.id : null;
        // Kept in memory only: say so instead of "Saved".
        patchState(store, { saveStatus: repository.persistent ? 'saved' : 'unavailable' });
      } catch (error) {
        const failure = error instanceof SaveError ? error.failure : 'failed';
        stopped = failure === 'conflict';
        patchState(store, { saveStatus: failure });
      }
    });
  };

  /** Loads the saved match (or starts the saved setup), then saves every change. */
  const start = (): void => {
    if (!config || !repository) {
      return;
    }
    const { gameId } = config;
    const begin = (stored: StoredSeries | null): void => {
      // The series' version, even when its game is missing or unreadable: the next save builds on it.
      memory.version = stored?.series.version ?? 0;
      const game = stored?.game;
      if (stored && game && restoreMatch(store, rules, { series: stored.series, game }, memory)) {
        preferences.setPlay(gameId, {
          mode: store.mode(),
          level: store.level(),
          variant: store.variant(),
        });
      } else {
        startSetup(store, preferences.play()[gameId]);
      }
      patchState(store, { ready: true });
      store._requestOpponent();
      effect(
        () => {
          // Everything a save writes: any change saves again.
          store.position();
          store.wins();
          store.draws();
          store.mode();
          store.xPlayer();
          untracked(save);
        },
        { injector },
      );
    };
    repository.load(gameId).then(begin, () => {
      // The saved games cannot be read: play on, but never write over them.
      stopped = true;
      begin(null);
      patchState(store, { saveStatus: 'unavailable' });
    });
  };

  return { _startStorage: start, retrySave: save };
}
