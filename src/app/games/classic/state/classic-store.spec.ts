import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Move } from '@classic/core';
import { ClassicSession } from '@classic/session';
import { GameSession, Opponent, type OpponentRequest, provideMatchStorage } from '@match';
import { Preferences } from '@settings';
import { GameRepository, MemoryRepository, SaveError, type StoredSeries } from '@storage';
import { ClassicStore } from './classic-store';

/** An opponent the test answers by hand. */
class FakeOpponent extends Opponent<Move> {
  readonly requests: OpponentRequest<Move>[] = [];
  private settle: ((move: Move | null) => void) | undefined;

  reply(request: OpponentRequest<Move>): Promise<Move | null> {
    this.requests.push(request);
    return new Promise((resolve) => (this.settle = resolve));
  }

  cancel(): void {
    this.settle?.(null);
  }

  answer(cell: number): void {
    this.settle?.({ cell });
  }
}

/** A repository whose load waits for `release()`: a slow IndexedDB open on a phone. */
class SlowRepository extends MemoryRepository {
  private gate: (() => void) | undefined;

  override load(gameId: 'super-3t' | 'classic'): Promise<StoredSeries | null> {
    return new Promise<void>((resolve) => (this.gate = resolve)).then(() => super.load(gameId));
  }

  release(): void {
    this.gate?.();
  }
}

/** Finds the series but not its current game (a record lost or never written). */
class MissingGameRepository extends MemoryRepository {
  constructor(private readonly inner: MemoryRepository) {
    super(true);
  }

  override async load(gameId: 'super-3t' | 'classic'): Promise<StoredSeries | null> {
    const stored = await this.inner.load(gameId);
    return stored && { series: stored.series, game: null };
  }

  override save(...args: Parameters<MemoryRepository['save']>): Promise<void> {
    return this.inner.save(...args);
  }
}

/** Runs effects and lets the repository's promises settle. */
async function settle(): Promise<void> {
  for (let round = 0; round < 4; round++) {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * A classic store in its own injector, like a tab: several can be open at once over the same
 * `repository`, and opening another after one is a reload of the same browser.
 */
async function open(repository: MemoryRepository, opponent = new FakeOpponent()) {
  const tab = createEnvironmentInjector(
    [
      { provide: GameSession, useClass: ClassicSession },
      { provide: Opponent, useValue: opponent },
      { provide: GameRepository, useValue: repository },
      provideMatchStorage('classic'),
      ClassicStore,
    ],
    TestBed.inject(EnvironmentInjector),
  );
  const store = tab.get(ClassicStore);
  await settle();
  return { store, opponent };
}

describe('saving and restoring a classic match', () => {
  beforeEach(() => localStorage.clear());

  it('starts the saved setup when nothing is stored, then saves the game', async () => {
    const repository = new MemoryRepository(true);
    const { store } = await open(repository);
    expect(store.ready()).toBe(true);
    store.play({ cell: 4 });
    await settle();
    expect(store.saveStatus()).toBe('saved');
    expect((await repository.load('classic'))?.game?.moves).toEqual([{ cell: 4 }]);
  });

  it('restores the moves, the turn, the score and who plays', async () => {
    const repository = new MemoryRepository(true);
    const first = await open(repository);
    first.store.play({ cell: 4 });
    first.store.play({ cell: 0 });
    await settle();

    const { store } = await open(repository);
    expect(store.game().moves).toEqual([{ cell: 4 }, { cell: 0 }]);
    expect(store.game().turn).toBe('X');
    expect(store.id()).toBe(first.store.id());
  });

  it('asks the opponent once when the saved game stopped on its turn', async () => {
    const repository = new MemoryRepository(true);
    TestBed.inject(Preferences).setPlay('classic', { mode: 'opponent', level: 'advanced' });
    const first = await open(repository);
    first.store.play({ cell: 4 });
    await settle();
    expect(first.opponent.requests).toHaveLength(1);

    const { store, opponent } = await open(repository);
    expect(store.mode()).toBe('opponent');
    expect(opponent.requests).toHaveLength(1);
    expect(opponent.requests[0]?.moves).toEqual([{ cell: 4 }]);
    opponent.answer(0);
    await settle();
    expect(store.game().moves).toHaveLength(2);
  });

  it('counts a finished game once, however often it is reopened', async () => {
    const repository = new MemoryRepository(true);
    const first = await open(repository);
    for (const cell of [0, 3, 1, 4, 2]) {
      first.store.play({ cell });
    }
    await settle();
    expect(first.store.wins()).toEqual([1, 0]);

    for (let visit = 0; visit < 2; visit++) {
      const { store } = await open(repository);
      expect(store.isOver()).toBe(true);
      expect(store.wins()).toEqual([1, 0]);
    }
    const { store } = await open(repository);
    store.rematch();
    await settle();
    expect(store.wins()).toEqual([1, 0]);
    // The rematch is a new game of the same series.
    expect(store.id()).not.toBe(first.store.id());
    expect(store.seriesId()).toBe(first.store.seriesId());
    expect(await repository.finished('classic')).toHaveLength(1);
  });

  it('stops saving after another tab saved first', async () => {
    const repository = new MemoryRepository(true);
    const a = await open(repository);
    const b = await open(repository);
    b.store.play({ cell: 4 });
    await settle();
    a.store.play({ cell: 0 });
    await settle();
    expect(a.store.saveStatus()).toBe('conflict');
    expect((await repository.load('classic'))?.game?.moves).toEqual([{ cell: 4 }]);
  });

  it('ignores moves and commands until the saved match is back', async () => {
    const repository = new SlowRepository(true);
    const { store } = await open(repository);
    expect(store.ready()).toBe(false);
    store.play({ cell: 4 });
    store.newSeries();
    expect(store.game().moves).toEqual([]);
    repository.release();
    await settle();
    expect(store.ready()).toBe(true);
    store.play({ cell: 4 });
    expect(store.game().moves).toEqual([{ cell: 4 }]);
  });

  it('builds on the series when its current game is missing, instead of a false conflict', async () => {
    const repository = new MemoryRepository(true);
    const first = await open(repository);
    first.store.play({ cell: 4 });
    await settle();
    const { store } = await open(new MissingGameRepository(repository));
    store.play({ cell: 0 });
    await settle();
    expect(store.saveStatus()).toBe('saved');
  });

  it('starts a new game, unlocked, when the saved moves are damaged', async () => {
    const repository = new MemoryRepository(true);
    const first = await open(repository);
    first.store.play({ cell: 4 });
    await settle();
    const stored = await repository.load('classic');
    if (!stored?.game) {
      throw new Error('nothing saved');
    }
    const damaged = { ...stored.game, moves: null as unknown as readonly unknown[] };
    const version = stored.series.version;
    await repository.save(
      { series: { ...stored.series, version: version + 1 }, game: damaged },
      version,
    );

    const { store } = await open(repository);
    expect(store.ready()).toBe(true);
    expect(store.game().moves).toEqual([]);
    store.play({ cell: 0 });
    await settle();
    expect(store.saveStatus()).toBe('saved');
    // The damaged record is not overwritten: the new game has another id.
    expect(repository.has(damaged.id)).toBe(true);
  });

  it('says the game will not be kept when there is only memory', async () => {
    const { store } = await open(new MemoryRepository());
    store.play({ cell: 4 });
    await settle();
    expect(store.saveStatus()).toBe('unavailable');
  });

  it('deletes a game left unfinished when the series moves on, and keeps finished ones', async () => {
    const repository = new MemoryRepository(true);
    const { store } = await open(repository);
    store.play({ cell: 4 });
    await settle();
    const abandoned = store.id();
    store.newSeries();
    await settle();
    expect(repository.has(abandoned)).toBe(false);

    for (const cell of [0, 3, 1, 4, 2]) {
      store.play({ cell });
    }
    await settle();
    const won = store.id();
    store.rematch();
    await settle();
    expect(repository.has(won)).toBe(true);
  });

  it('reports a full disk and saves on retry', async () => {
    const repository = new MemoryRepository(true);
    const { store } = await open(repository);
    repository.failWith = new SaveError('quota');
    store.play({ cell: 4 });
    await settle();
    expect(store.saveStatus()).toBe('quota');

    repository.failWith = null;
    store.retrySave();
    await settle();
    expect(store.saveStatus()).toBe('saved');
    expect((await repository.load('classic'))?.game?.moves).toEqual([{ cell: 4 }]);
  });
});
