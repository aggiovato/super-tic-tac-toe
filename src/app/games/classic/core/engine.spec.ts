import fc from 'fast-check';
import { LINES } from '@tictac';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves } from './engine';
import type { GameState, Move } from './models';
import { replay } from './replay';

/** Plays cells in order from the opening and fails on the first refused move. */
const play = (...cells: number[]): GameState =>
  cells.reduce((state, cell) => {
    const result = applyMove(state, { cell });
    if (!result.ok) {
      throw new Error(`cell ${cell} refused: ${result.reason}`);
    }
    return result.state;
  }, initialState());

describe('the classic engine', () => {
  it('opens on an empty board with X to move and nine legal cells', () => {
    const start = initialState();
    expect(start.turn).toBe('X');
    expect(start.status).toEqual({ kind: 'in-progress' });
    expect(legalMoves(start)).toHaveLength(9);
  });

  it('alternates players and counts each accepted move', () => {
    const state = play(4, 0);
    expect(state.cells[4]).toBe('X');
    expect(state.cells[0]).toBe('O');
    expect(state.turn).toBe('X');
    expect(state.revision).toBe(2);
    expect(state.moves).toEqual([{ cell: 4 }, { cell: 0 }]);
  });

  it.each(LINES.map((line) => [line.join('-'), line] as const))(
    'wins at once on the %s line',
    (_, line) => {
      // X takes the line; O fills cells off it.
      const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((cell) => !line.includes(cell));
      const state = play(line[0], others[0] ?? -1, line[1], others[1] ?? -1, line[2]);
      expect(state.status).toEqual({ kind: 'won', winner: 'X', line });
      expect(legalMoves(state)).toEqual([]);
    },
  );

  it('draws a full board with no line', () => {
    // X O X / X O O / O X X
    const state = play(0, 1, 2, 4, 3, 5, 7, 6, 8);
    expect(state.status).toEqual({ kind: 'drawn' });
  });

  it('gives the win, not the draw, when the ninth cell completes a line', () => {
    // X O X / O X O / O X _ : X's ninth piece on cell 8 completes 0-4-8.
    const state = play(0, 1, 2, 3, 4, 5, 7, 6, 8);
    expect(state.status).toEqual({ kind: 'won', winner: 'X', line: [0, 4, 8] });
  });

  it('refuses in order: game over, then bad coordinates, then a taken cell', () => {
    const over = play(0, 3, 1, 4, 2);
    expect(applyMove(over, { cell: 99 })).toMatchObject({ ok: false, reason: 'game-over' });
    const start = play(4);
    expect(applyMove(start, { cell: 9 })).toMatchObject({
      ok: false,
      reason: 'invalid-coordinates',
    });
    expect(applyMove(start, { cell: 1.5 })).toMatchObject({
      ok: false,
      reason: 'invalid-coordinates',
    });
    expect(applyMove(start, { cell: 4 })).toMatchObject({ ok: false, reason: 'cell-occupied' });
    // A refusal keeps the position, the turn and the revision.
    expect(applyMove(start, { cell: 4 }).state).toBe(start);
  });
});

describe('replay', () => {
  it('rebuilds the same state from the moves', () => {
    const state = play(4, 0, 8, 2);
    expect(replay(state.moves, 1)).toEqual({ ok: true, state });
  });

  it('stops at the first illegal move and refuses another rules version', () => {
    expect(replay([{ cell: 4 }, { cell: 4 }], 1)).toMatchObject({
      ok: false,
      reason: 'cell-occupied',
      index: 1,
    });
    expect(replay([], 2)).toEqual({ ok: false, reason: 'unsupported-rules-version' });
  });
});

describe('invariants (fast-check)', () => {
  const moves = fc.array(
    fc.integer({ min: -1, max: 9 }).map((cell): Move => ({ cell })),
    {
      maxLength: 20,
    },
  );

  it('adds exactly one piece per accepted move, never changes on a refusal, never passes nine', () => {
    fc.assert(
      fc.property(moves, (sequence) => {
        let state = initialState();
        for (const move of sequence) {
          const result = applyMove(state, move);
          const pieces = state.cells.filter((mark) => mark !== null).length;
          if (result.ok) {
            expect(result.state.cells.filter((mark) => mark !== null).length).toBe(pieces + 1);
            state = result.state;
          } else {
            expect(result.state).toBe(state);
          }
          expect(state.moves.length).toBeLessThanOrEqual(9);
        }
        expect(replay(state.moves, 1)).toEqual({ ok: true, state });
      }),
    );
  });
});
