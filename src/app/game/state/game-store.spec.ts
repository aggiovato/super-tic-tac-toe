import { TestBed } from '@angular/core/testing';
import type { Move } from '@core';
import { GLOBAL_DIAGONAL_WIN, GLOBAL_DRAW, parseMoves } from '@core/testing';
import { Opponent, provideLocalGameSession, type OpponentRequest } from '@session';
import { GameStore } from './game-store';

/** An opponent the test answers by hand: in time, late, wrongly or not at all. */
class FakeOpponent extends Opponent {
  readonly requests: OpponentRequest[] = [];
  cancels = 0;
  private readonly settles: {
    resolve: (move: Move | null) => void;
    reject: (error: Error) => void;
  }[] = [];

  reply(request: OpponentRequest): Promise<Move | null> {
    this.requests.push(request);
    return new Promise((resolve, reject) => this.settles.push({ resolve, reject }));
  }

  /** As the contract says: the request in flight resolves null. */
  cancel(): void {
    this.cancels += 1;
    this.settles.at(-1)?.resolve(null);
  }

  /** Answers request `index` (the latest by default). */
  answer(move: Move | null, index = this.settles.length - 1): void {
    this.settles[index]?.resolve(move);
  }

  fail(): void {
    this.settles.at(-1)?.reject(new Error('worker crashed'));
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const at = (notation: string): Move => parseMoves(notation)[0];

function setup(): GameStore {
  return setupWith().store;
}

function setupWith(): { store: GameStore; opponent: FakeOpponent } {
  const opponent = new FakeOpponent();
  TestBed.configureTestingModule({
    providers: [provideLocalGameSession(), { provide: Opponent, useValue: opponent }, GameStore],
  });
  return { store: TestBed.inject(GameStore), opponent };
}

function againstOpponent(): { store: GameStore; opponent: FakeOpponent } {
  const setup = setupWith();
  setup.store.setMode('opponent', 'beginner');
  return setup;
}

function playAll(store: GameStore, notation: string): void {
  for (const move of parseMoves(notation)) {
    store.play(move);
  }
}

describe('GameStore', () => {
  it('starts with X to move anywhere and the whole board in view', () => {
    const store = setup();
    expect(store.game().turn).toBe('X');
    expect(store.legal()).toHaveLength(81);
    expect(store.view()).toEqual({ kind: 'global' });
    expect(store.toMove()).toBe(0);
  });

  it('publishes an accepted move and forces the next board', () => {
    const store = setup();
    store.play({ board: 4, cell: 2 });
    expect(store.game().cells[4]?.[2]).toBe('X');
    expect(store.game().target).toEqual({ kind: 'forced', board: 2 });
    expect([...store.playableBoards()]).toEqual([2]);
    expect(store.lastMove()).toEqual({ board: 4, cell: 2 });
  });

  it('keeps the position on a double tap and records why', () => {
    const store = setup();
    store.play({ board: 4, cell: 2 });
    const before = store.game();
    store.play({ board: 4, cell: 2 });
    expect(store.game()).toBe(before);
    expect(store.lastRejection()).toBe('wrong-board');
  });

  it('returns to the whole board after every move', () => {
    const store = setup();
    store.openBoard(4);
    store.play({ board: 4, cell: 2 });
    expect(store.view()).toEqual({ kind: 'global' });
  });

  it('takes back the last move while the game goes on, but not after it ends', () => {
    const store = setup();
    store.play({ board: 4, cell: 2 });
    store.play({ board: 2, cell: 4 });
    store.undo();
    expect(store.game().moves).toEqual([{ board: 4, cell: 2 }]);
    expect(store.game().turn).toBe('O');
    expect(store.game().target).toEqual({ kind: 'forced', board: 2 });

    store.undo();
    store.undo();
    expect(store.game().moves).toEqual([]);

    playAll(store, GLOBAL_DIAGONAL_WIN);
    store.undo();
    expect(store.isOver()).toBe(true);
    expect(store.wins()).toEqual([1, 0]);
  });

  it('only zooms into boards that can be played', () => {
    const store = setup();
    store.play({ board: 4, cell: 2 });
    store.openBoard(5);
    expect(store.view()).toEqual({ kind: 'global' });
    store.openBoard(2);
    expect(store.view()).toEqual({ kind: 'board', board: 2 });
    store.showGlobal();
    expect(store.view()).toEqual({ kind: 'global' });
  });

  it('previews where a cell would send the opponent without changing the game', () => {
    const store = setup();
    const before = store.game();
    store.setPreview({ board: 4, cell: 5 });
    expect(store.previewTarget()).toBe(5);
    expect(store.game()).toBe(before);
    store.setPreview(null);
    expect(store.previewTarget()).toBeUndefined();
  });

  it('counts a win once for the participant, then swaps symbols on rematch', () => {
    const store = setup();
    playAll(store, GLOBAL_DIAGONAL_WIN);
    expect(store.isOver()).toBe(true);
    expect(store.wins()).toEqual([1, 0]);

    store.play({ board: 1, cell: 0 });
    expect(store.wins()).toEqual([1, 0]);

    store.rematch();
    expect(store.game().moves).toEqual([]);
    expect(store.symbolOf(0)).toBe('O');
    expect(store.symbolOf(1)).toBe('X');
    expect(store.toMove()).toBe(1);

    playAll(store, GLOBAL_DIAGONAL_WIN);
    expect(store.wins()).toEqual([1, 1]);
  });

  it('counts a draw and resets everything on a new series', () => {
    const store = setup();
    playAll(store, GLOBAL_DRAW);
    expect(store.draws()).toBe(1);

    store.newSeries();
    expect(store.draws()).toBe(0);
    expect(store.wins()).toEqual([0, 0]);
    expect(store.symbolOf(0)).toBe('X');
    expect(store.game().moves).toEqual([]);
  });

  describe('against the computer', () => {
    it('starts a new series with the person playing X', () => {
      const { store, opponent } = againstOpponent();
      expect(store.mode()).toBe('opponent');
      expect(store.symbolOf(0)).toBe('X');
      expect(store.toMove()).toBe(0);
      expect(opponent.requests).toHaveLength(0);
    });

    it('asks for a reply after the person moves, then plays it', async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      expect(store.thinking()).toBe(true);
      expect(store.legal()).toHaveLength(0);
      expect(opponent.requests[0]?.moves).toEqual([at('4.2')]);
      expect(Number.isInteger(opponent.requests[0]?.seed)).toBe(true);

      opponent.answer(at('2.4'));
      await flush();
      expect(store.game().moves).toEqual([at('4.2'), at('2.4')]);
      expect(store.thinking()).toBe(false);
      expect(store.opponentMoves()).toBe(1);
      expect(store.toMove()).toBe(0);
    });

    it('ignores the person while the opponent thinks', () => {
      const { store } = againstOpponent();
      store.play(at('4.2'));
      store.play(at('2.4'));
      expect(store.game().moves).toEqual([at('4.2')]);
      expect(store.lastRejection()).toBeNull();
    });

    it('cancels the request on undo and plays nothing for it', async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      store.undo();
      expect(opponent.cancels).toBe(1);
      expect(store.thinking()).toBe(false);
      await flush();
      expect(store.game().moves).toEqual([]);
      expect(store.opponentMoves()).toBe(0);
    });

    it('ignores a cancelled request when an undo and a replay reach the same revision', async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      store.undo();
      store.play(at('4.2'));
      await flush();
      // The cancelled request resolved null: no fallback move, still waiting for the new reply.
      expect(store.game().moves).toEqual([at('4.2')]);
      expect(store.thinking()).toBe(true);

      opponent.answer(at('2.4'));
      await flush();
      expect(store.game().moves).toEqual([at('4.2'), at('2.4')]);
    });

    it('drops a reply that arrives after a rematch', async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      store.rematch();
      // The opponent now plays X and opens the new game with a second request.
      expect(opponent.requests).toHaveLength(2);
      opponent.answer(at('2.4'), 0);
      await flush();
      expect(store.game().moves).toEqual([]);
      expect(store.thinking()).toBe(true);

      opponent.answer(at('4.4'), 1);
      await flush();
      expect(store.game().moves).toEqual([at('4.4')]);
    });

    it('plays nothing into a store whose route is gone', async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      TestBed.resetTestingModule();
      expect(opponent.cancels).toBe(1);
      opponent.answer(at('2.4'), 0);
      await flush();
      expect(store.game().moves).toEqual([at('4.2')]);
    });

    it("takes back the reply and the person's move together", async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      opponent.answer(at('2.4'));
      await flush();
      expect(store.canUndo()).toBe(true);
      store.undo();
      expect(store.game().moves).toEqual([]);
      expect(store.toMove()).toBe(0);
    });

    it('opens as X after a rematch and leaves nothing to undo yet', async () => {
      const { store, opponent } = againstOpponent();
      store.rematch();
      expect(store.symbolOf(1)).toBe('X');
      expect(opponent.requests[0]?.moves).toEqual([]);
      opponent.answer(at('4.4'));
      await flush();
      expect(store.toMove()).toBe(0);
      expect(store.canUndo()).toBe(false);
    });

    it('plays a legal move when the reply is illegal or the opponent fails', async () => {
      const { store, opponent } = againstOpponent();
      store.play(at('4.2'));
      opponent.answer(at('0.0'));
      await flush();
      // Board 2 is forced: the first legal move there stands in for the illegal reply.
      expect(store.game().moves).toEqual([at('4.2'), at('2.0')]);

      const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      store.play(at('0.4'));
      opponent.fail();
      await flush();
      expect(store.game().moves).toHaveLength(4);
      expect(store.thinking()).toBe(false);
      expect(errors).toHaveBeenCalledOnce();
      errors.mockRestore();
    });

    it("counts the opponent's win once", async () => {
      const { store, opponent } = againstOpponent();
      store.rematch();
      // The opponent plays X's moves of the fixture, the person O's.
      for (const [index, move] of parseMoves(GLOBAL_DIAGONAL_WIN).entries()) {
        if (index % 2 === 0) {
          opponent.answer(move);
          await flush();
        } else {
          store.play(move);
        }
      }
      expect(store.isOver()).toBe(true);
      expect(store.wins()).toEqual([0, 1]);
      store.undo();
      expect(store.wins()).toEqual([0, 1]);
    });
  });
});
