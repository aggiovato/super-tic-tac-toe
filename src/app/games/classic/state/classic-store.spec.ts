import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Move } from '@classic/core';
import { ClassicSession } from '@classic/session';
import { GameSession, Opponent, type OpponentRequest, provideMatchStorage } from '@match';
import { Preferences } from '@settings';
import { GameRepository, MemoryRepository, SaveError } from '@storage';
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
    const repository = new MemoryRepository();
    const { store } = await open(repository);
    expect(store.ready()).toBe(true);
    store.play({ cell: 4 });
    await settle();
    expect(store.saveStatus()).toBe('saved');
    expect((await repository.load('classic'))?.game.moves).toEqual([{ cell: 4 }]);
  });

  it('restores the moves, the turn, the score and who plays', async () => {
    const repository = new MemoryRepository();
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
    const repository = new MemoryRepository();
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
    const repository = new MemoryRepository();
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
    const repository = new MemoryRepository();
    const a = await open(repository);
    const b = await open(repository);
    b.store.play({ cell: 4 });
    await settle();
    a.store.play({ cell: 0 });
    await settle();
    expect(a.store.saveStatus()).toBe('conflict');
    expect((await repository.load('classic'))?.game.moves).toEqual([{ cell: 4 }]);
  });

  it('reports a full disk and saves on retry', async () => {
    const repository = new MemoryRepository();
    const { store } = await open(repository);
    repository.failWith = new SaveError('quota');
    store.play({ cell: 4 });
    await settle();
    expect(store.saveStatus()).toBe('quota');

    repository.failWith = null;
    store.retrySave();
    await settle();
    expect(store.saveStatus()).toBe('saved');
    expect((await repository.load('classic'))?.game.moves).toEqual([{ cell: 4 }]);
  });
});
