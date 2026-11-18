import { describe, expect, it } from 'vitest';
import { LINES } from './lines';
import { resolveBoard, resolveGame } from './resolve';
import type { BoardStatus, Mark } from './models';

const marks = (notation: string): Mark[] =>
  [...notation].map((char) => (char === 'X' || char === 'O' ? char : null));

const OPEN: BoardStatus = { kind: 'open' };
const DRAWN: BoardStatus = { kind: 'drawn' };
const wonBy = (winner: 'X' | 'O'): BoardStatus => ({ kind: 'won', winner, line: [0, 1, 2] });

describe('resolveBoard', () => {
  it.each(LINES.map((line) => [line.join('-'), line] as const))(
    'closes the board for the mover on the %s line',
    (_, line) => {
      const cells = Array.from({ length: 9 }, (_, index): Mark =>
        line.includes(index) ? 'X' : null,
      );
      expect(resolveBoard(cells, 'X')).toEqual({ kind: 'won', winner: 'X', line });
    },
  );

  it('keeps a board with empty cells and no line open', () => {
    expect(resolveBoard(marks('XO.......'), 'O')).toEqual(OPEN);
  });

  it('draws a full board with no line', () => {
    expect(resolveBoard(marks('XOXXOOOXX'), 'X')).toEqual(DRAWN);
  });

  it('gives the win, not the draw, when the ninth cell completes a line', () => {
    // X O X / O X O / O X X: the last X on cell 8 fills the board and completes 0-4-8.
    expect(resolveBoard(marks('XOXOXOOXX'), 'X')).toEqual({
      kind: 'won',
      winner: 'X',
      line: [0, 4, 8],
    });
  });
});

describe('resolveGame', () => {
  it.each(LINES.map((line) => [line.join('-'), line] as const))(
    'wins the game on the %s line of boards',
    (_, line) => {
      const boards = Array.from({ length: 9 }, (_, index) =>
        line.includes(index) ? wonBy('O') : OPEN,
      );
      expect(resolveGame(boards, 'O')).toEqual({ kind: 'won', winner: 'O', line });
    },
  );

  it('treats a drawn board as neutral inside a line', () => {
    const boards = [wonBy('X'), wonBy('X'), DRAWN, OPEN, OPEN, OPEN, OPEN, OPEN, OPEN];
    expect(resolveGame(boards, 'X')).toEqual({ kind: 'in-progress' });
  });

  it('draws when every board is closed with no line, even if X owns more boards', () => {
    // X owns 0, 1, 5, 6 and O owns 2, 3: no tie-break by counting boards.
    const boards = [
      wonBy('X'),
      wonBy('X'),
      wonBy('O'),
      wonBy('O'),
      DRAWN,
      wonBy('X'),
      wonBy('X'),
      DRAWN,
      DRAWN,
    ];
    expect(resolveGame(boards, 'X')).toEqual({ kind: 'drawn' });
  });

  it('keeps playing while any board is open', () => {
    const boards = [...Array.from({ length: 8 }, () => DRAWN), OPEN];
    expect(resolveGame(boards, 'O')).toEqual({ kind: 'in-progress' });
  });
});
