import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  applyMove,
  boxesBeside,
  initialState,
  legalMoves,
  lineIndex,
  sizeOf,
  statusOf,
} from './engine';
import type { GameState, Move } from './models';
import { replay } from './replay';

const h = (row: number, col: number): Move => ({ orientation: 'h', row, col });
const v = (row: number, col: number): Move => ({ orientation: 'v', row, col });

/** Plays moves from an empty board of `size` and fails on the first refused one. */
const play = (moves: readonly Move[], size: 3 | 5 = 3): GameState =>
  moves.reduce((state, move) => {
    const result = applyMove(state, move);
    if (!result.ok) {
      throw new Error(`${move.orientation}${move.row},${move.col} refused: ${result.reason}`);
    }
    return result.state;
  }, initialState(size));

/** Draws every line of the board in reading order (horizontals, then verticals). */
const allLines = (size: number): Move[] => [
  ...Array.from({ length: (size + 1) * size }, (_, i) => h(Math.floor(i / size), i % size)),
  ...Array.from({ length: size * (size + 1) }, (_, i) =>
    v(Math.floor(i / (size + 1)), i % (size + 1)),
  ),
];

describe('the Dots and Boxes engine', () => {
  it('opens on an empty board, X to move, with every line to draw', () => {
    for (const size of [3, 5] as const) {
      const start = initialState(size);
      expect(start.turn).toBe('X');
      expect(legalMoves(start)).toHaveLength(2 * size * (size + 1));
      expect(start.boxes).toHaveLength(size * size);
    }
  });

  it('names its sizes by variant and refuses others', () => {
    expect(sizeOf('3')).toBe(3);
    expect(sizeOf('5')).toBe(5);
    expect(sizeOf('4')).toBeNull();
    expect(sizeOf('')).toBeNull();
  });

  it('passes the turn after a line that closes nothing', () => {
    const state = play([h(0, 0)]);
    expect(state.turn).toBe('O');
    expect(state.h[0]).toBe('X');
  });

  it('gives a closed box to the mover, who moves again', () => {
    // X: top, O: left, X: right, O: bottom closes box 0 for O.
    const state = play([h(0, 0), v(0, 0), v(0, 1), h(1, 0)]);
    expect(state.boxes[0]).toBe('O');
    expect(state.score).toEqual({ X: 0, O: 1 });
    expect(state.turn).toBe('O');
  });

  it('closes two boxes with one line and still moves once more', () => {
    // Boxes 0 and 1 share v(0,1); every other side is drawn first, with the turn passing.
    const sides = [h(0, 0), h(1, 0), v(0, 0), h(0, 1), h(1, 1), v(0, 2)];
    const before = play(sides);
    const result = applyMove(before, v(0, 1));
    expect(result.ok && result.closed).toBe(2);
    expect(result.state.boxes.slice(0, 2)).toEqual([before.turn, before.turn]);
    expect(result.state.turn).toBe(before.turn);
  });

  it('ends when every line is drawn: more boxes win', () => {
    const end = play(allLines(3));
    expect(end.boxes.every((owner) => owner !== null)).toBe(true);
    expect(end.score.X + end.score.O).toBe(9);
    expect(end.status).toEqual({
      kind: 'won',
      winner: end.score.X > end.score.O ? 'X' : 'O',
    });
    expect(legalMoves(end)).toEqual([]);
  });

  it('calls a tie a draw (only possible on an even board, kept for later sizes)', () => {
    expect(statusOf(['X', 'O', 'X', 'O'], { X: 2, O: 2 })).toEqual({ kind: 'drawn' });
    expect(statusOf(['X', null, 'X', 'O'], { X: 2, O: 1 })).toEqual({ kind: 'in-progress' });
  });

  it('refuses in order: game over, then off the board, then a drawn line', () => {
    const end = play(allLines(3));
    expect(applyMove(end, h(9, 9))).toMatchObject({ ok: false, reason: 'game-over' });
    const start = play([h(0, 0)]);
    expect(applyMove(start, h(4, 0))).toMatchObject({ ok: false, reason: 'invalid-coordinates' });
    expect(applyMove(start, v(0, 4))).toMatchObject({ ok: false, reason: 'invalid-coordinates' });
    expect(applyMove(start, h(0.5, 0))).toMatchObject({ ok: false, reason: 'invalid-coordinates' });
    expect(applyMove(start, h(0, 0))).toMatchObject({ ok: false, reason: 'line-taken' });
    expect(applyMove(start, h(0, 0)).state).toBe(start);
  });

  it('maps lines to their boxes on the edge and inside', () => {
    expect(boxesBeside(3, h(0, 1))).toEqual([1]);
    expect(boxesBeside(3, h(1, 1))).toEqual([1, 4]);
    expect(boxesBeside(3, v(2, 3))).toEqual([8]);
    expect(lineIndex(3, v(2, 3))).toBe(11);
    expect(lineIndex(3, { orientation: 'd' as 'h', row: 0, col: 0 })).toBe(-1);
  });
});

describe('replay', () => {
  it('rebuilds the same state from the moves and the size', () => {
    const state = play([h(0, 0), v(0, 0), v(0, 1), h(1, 0)], 5);
    expect(replay(state.moves, 1, '5')).toEqual({ ok: true, state });
  });

  it('refuses another rules version, an unknown size, and stops at an illegal move', () => {
    expect(replay([], 2, '3')).toEqual({ ok: false, reason: 'unsupported-rules-version' });
    // An unknown size is the default board, as when a game starts.
    expect(replay([], 1, '7')).toMatchObject({ ok: true, state: { size: 3 } });
    expect(replay([h(0, 0), h(0, 0)], 1, '3')).toMatchObject({ ok: false, index: 1 });
  });
});

describe('invariants (fast-check)', () => {
  it('draws one line per accepted move, never reopens a box, and moves again only after closing', () => {
    fc.assert(
      fc.property(fc.array(fc.nat({ max: 23 }), { maxLength: 40 }), (picks) => {
        let state = initialState(3);
        for (const pick of picks) {
          const legal = legalMoves(state);
          const move = legal[pick % Math.max(1, legal.length)];
          if (!move) {
            break;
          }
          const result = applyMove(state, move);
          if (!result.ok) {
            throw new Error('a legal move was refused');
          }
          const drawn = (s: GameState) => [...s.h, ...s.v].filter(Boolean).length;
          expect(drawn(result.state)).toBe(drawn(state) + 1);
          state.boxes.forEach((owner, box) => owner && expect(result.state.boxes[box]).toBe(owner));
          expect(result.state.turn === state.turn).toBe(result.closed > 0);
          state = result.state;
        }
        expect(replay(state.moves, 1, '3')).toEqual({ ok: true, state });
      }),
    );
  });
});
