import { describe, expect, it } from 'vitest';
import { LINES } from './lines';
import type { BoardStatus, Mark } from './models';
import { resolveBoard } from './resolve';

const marks = (notation: string): Mark[] =>
  [...notation].map((char) => (char === 'X' || char === 'O' ? char : null));

const OPEN: BoardStatus = { kind: 'open' };
const DRAWN: BoardStatus = { kind: 'drawn' };

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
