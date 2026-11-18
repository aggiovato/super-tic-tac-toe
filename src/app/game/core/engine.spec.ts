import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves } from './engine';
import {
  CLOSES_OWN_TARGET,
  GLOBAL_DIAGONAL_WIN,
  GLOBAL_DRAW,
  POINTS_TO_DRAWN_BOARD,
} from './testing/fixtures';
import { parseMoves, play } from './testing/notation';
import type { GameState, Move } from './types';

const boardsOf = (moves: readonly Move[]): number[] => [
  ...new Set(moves.map((move) => move.board)),
];
const openBoards = (state: GameState): number[] =>
  state.boards.flatMap((board, index) => (board.kind === 'open' ? [index] : []));

describe('opening', () => {
  it('starts with X to move anywhere on nine open boards', () => {
    const state = initialState();
    expect(state.turn).toBe('X');
    expect(state.target).toEqual({ kind: 'free' });
    expect(state.status).toEqual({ kind: 'in-progress' });
    expect(state.boards.every((board) => board.kind === 'open')).toBe(true);
    expect(state.revision).toBe(0);
    expect(legalMoves(state)).toHaveLength(81);
  });
});

describe('reference scenarios', () => {
  it('forces O onto board 2 after X opens on board 4, cell 2', () => {
    const state = play('4.2');
    expect(state.cells[4][2]).toBe('X');
    expect(state.turn).toBe('O');
    expect(state.target).toEqual({ kind: 'forced', board: 2 });
    expect(boardsOf(legalMoves(state))).toEqual([2]);
    expect(legalMoves(state)).toHaveLength(9);
  });

  it('sends X to board 4 when O plays cell 4 of board 2, keeping X’s earlier piece', () => {
    const state = play('4.2 2.4');
    expect(state.target).toEqual({ kind: 'forced', board: 4 });
    expect(state.cells[4][2]).toBe('X');
    expect(state.cells[2][4]).toBe('O');
    expect(legalMoves(state)).toHaveLength(8);
    expect(applyMove(state, { board: 4, cell: 2 })).toMatchObject({
      ok: false,
      reason: 'cell-occupied',
    });
  });

  it('gives O a free choice when X closes board 2 by playing its cell 2', () => {
    const state = play(CLOSES_OWN_TARGET);
    expect(state.boards[2]).toEqual({ kind: 'won', winner: 'X', line: [0, 1, 2] });
    expect(state.status).toEqual({ kind: 'in-progress' });
    expect(state.target).toEqual({ kind: 'free' });
    expect(boardsOf(legalMoves(state))).toEqual(openBoards(state));
    expect(boardsOf(legalMoves(state))).not.toContain(2);
  });

  it('enables every open board when the cell points to a drawn board, which stays closed', () => {
    const state = play(POINTS_TO_DRAWN_BOARD);
    expect(state.moves.at(-1)).toEqual({ board: 5, cell: 1 });
    expect(state.boards[1]).toEqual({ kind: 'drawn' });
    expect(state.target).toEqual({ kind: 'free' });
    expect(boardsOf(legalMoves(state))).toEqual(openBoards(state));
    expect(applyMove(state, { board: 1, cell: 0 })).toMatchObject({
      ok: false,
      reason: 'board-closed',
    });
  });

  it('wins immediately on the third board of a global diagonal, with empty cells left', () => {
    const before = play(GLOBAL_DIAGONAL_WIN.split(' ').slice(0, -1).join(' '));
    expect(before.status).toEqual({ kind: 'in-progress' });

    const state = play(GLOBAL_DIAGONAL_WIN);
    expect(state.status).toEqual({ kind: 'won', winner: 'X', line: [0, 4, 8] });
    expect(state.target).toEqual({ kind: 'game-over' });
    expect(state.cells.flat()).toContain(null);
    expect(legalMoves(state)).toEqual([]);
  });
});

describe('global draw', () => {
  it('ends drawn when every board closes with no global line', () => {
    const state = play(GLOBAL_DRAW);
    expect(state.boards.every((board) => board.kind !== 'open')).toBe(true);
    expect(state.status).toEqual({ kind: 'drawn' });
    expect(state.target).toEqual({ kind: 'game-over' });
    expect(legalMoves(state)).toEqual([]);
  });
});

describe('alternation', () => {
  it('alternates X and O and counts one revision per accepted move', () => {
    const moves = parseMoves('4.2 2.4 4.0 0.4');
    let state = initialState();
    for (const [index, move] of moves.entries()) {
      expect(state.turn).toBe(index % 2 === 0 ? 'X' : 'O');
      const result = applyMove(state, move);
      expect(result.ok).toBe(true);
      expect(result.state.cells[move.board][move.cell]).toBe(state.turn);
      expect(result.state.revision).toBe(index + 1);
      state = result.state;
    }
    expect(state.moves).toEqual(moves);
  });
});

describe('rejections', () => {
  const forcedOnTwo = play('4.2');

  it.each([
    ['a board below range', { board: -1, cell: 0 }],
    ['a board above range', { board: 9, cell: 0 }],
    ['a cell above range', { board: 2, cell: 9 }],
    ['a fractional cell', { board: 2, cell: 1.5 }],
    ['a NaN board', { board: Number.NaN, cell: 0 }],
  ])('rejects %s as invalid coordinates', (_, move) => {
    expect(applyMove(forcedOnTwo, move)).toMatchObject({
      ok: false,
      reason: 'invalid-coordinates',
    });
  });

  it('rejects a move outside the forced board', () => {
    expect(applyMove(forcedOnTwo, { board: 3, cell: 0 })).toMatchObject({
      ok: false,
      reason: 'wrong-board',
    });
  });

  it('rejects an occupied cell', () => {
    expect(applyMove(play('4.2 2.4'), { board: 4, cell: 2 })).toMatchObject({
      ok: false,
      reason: 'cell-occupied',
    });
  });

  it('rejects a closed board even during a free choice', () => {
    expect(applyMove(play(CLOSES_OWN_TARGET), { board: 2, cell: 5 })).toMatchObject({
      ok: false,
      reason: 'board-closed',
    });
  });

  it('rejects any move once the game is over', () => {
    expect(applyMove(play(GLOBAL_DIAGONAL_WIN), { board: 1, cell: 0 })).toMatchObject({
      ok: false,
      reason: 'game-over',
    });
  });

  it('returns the untouched state, keeping position, revision and turn', () => {
    const result = applyMove(forcedOnTwo, { board: 3, cell: 0 });
    expect(result.state).toBe(forcedOnTwo);
    expect(result.state.revision).toBe(1);
    expect(result.state.turn).toBe('O');
  });
});

describe('immutability', () => {
  it('never mutates the input state of an accepted move', () => {
    const state = play('4.2');
    const snapshot = JSON.parse(JSON.stringify(state)) as unknown;
    const result = applyMove(state, { board: 2, cell: 4 });
    expect(result.ok).toBe(true);
    expect(state).toEqual(snapshot);
  });
});
