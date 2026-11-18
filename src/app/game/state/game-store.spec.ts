import { TestBed } from '@angular/core/testing';
import { GLOBAL_DIAGONAL_WIN, GLOBAL_DRAW, parseMoves } from '@core/testing';
import { provideLocalGameSession } from '@session';
import { GameStore } from './game-store';

function setup(): GameStore {
  TestBed.configureTestingModule({ providers: [provideLocalGameSession(), GameStore] });
  return TestBed.inject(GameStore);
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

  it('opens the forced board zoomed on a compact layout and the whole board otherwise', () => {
    const store = setup();
    store.setCompact(true);
    store.play({ board: 4, cell: 2 });
    expect(store.view()).toEqual({ kind: 'board', board: 2 });

    store.setCompact(false);
    expect(store.view()).toEqual({ kind: 'global' });
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
});
