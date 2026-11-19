import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves } from './engine';
import { replay } from './replay';
import { RULES_VERSION, type GameState, type Move } from './models';

/**
 * One step of a generated history: either pick a legal move by index, or send a raw intent that
 * may be illegal (out of range, wrong board, occupied cell, closed board or after the end).
 */
const step = fc.oneof(
  { weight: 4, arbitrary: fc.record({ kind: fc.constant('legal' as const), pick: fc.nat() }) },
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constant('raw' as const),
      board: fc.integer({ min: -1, max: 9 }),
      cell: fc.integer({ min: -1, max: 9 }),
    }),
  },
);

const pieces = (state: GameState): number =>
  state.cells.flat().filter((mark) => mark !== null).length;
const sameMove = (a: Move) => (b: Move) => a.board === b.board && a.cell === b.cell;

function checkInvariants(state: GameState): void {
  const legal = legalMoves(state);
  expect(state.moves.length).toBeLessThanOrEqual(81);
  expect(state.revision).toBe(state.moves.length);
  expect(pieces(state)).toBe(state.moves.length);
  expect(legal.length === 0).toBe(state.status.kind !== 'in-progress');
  expect(state.target.kind === 'game-over').toBe(state.status.kind !== 'in-progress');
  if (state.target.kind === 'forced') {
    expect(state.boards[state.target.board]?.kind).toBe('open');
  }
}

describe('engine properties', () => {
  it('keeps every invariant along generated histories of legal and illegal intents', () => {
    fc.assert(
      fc.property(fc.array(step, { maxLength: 140 }), (steps) => {
        let state = initialState();
        for (const current of steps) {
          const legal = legalMoves(state);
          const move: Move =
            current.kind === 'raw'
              ? { board: current.board, cell: current.cell }
              : (legal[current.pick % Math.max(legal.length, 1)] ?? { board: 0, cell: 0 });

          const result = applyMove(state, move);
          // Legality and acceptance agree.
          expect(result.ok).toBe(legal.some(sameMove(move)));

          if (!result.ok) {
            expect(result.state).toBe(state);
            continue;
          }

          const next = result.state;
          // Exactly one piece is added, for the mover, on the chosen cell.
          expect(pieces(next)).toBe(pieces(state) + 1);
          expect(state.cells[move.board]?.[move.cell]).toBeNull();
          expect(next.cells[move.board]?.[move.cell]).toBe(state.turn);
          expect(next.turn).not.toBe(state.turn);
          // A closed board never reopens or changes owner.
          state.boards.forEach((board, index) => {
            if (board.kind !== 'open') {
              expect(next.boards[index]).toEqual(board);
            }
          });
          checkInvariants(next);
          state = next;
        }
        // The accepted history rebuilds exactly the same state.
        expect(replay(state.moves, RULES_VERSION)).toEqual({ ok: true, state });
      }),
      { numRuns: 300 },
    );
  });

  it('plays any random legal game to an end within 81 moves', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { minLength: 81, maxLength: 81 }), (picks) => {
        let state = initialState();
        for (const pick of picks) {
          const legal = legalMoves(state);
          if (legal.length === 0) {
            break;
          }
          const result = applyMove(state, legal[pick % legal.length]);
          expect(result.ok).toBe(true);
          state = result.state;
        }
        expect(state.status.kind).not.toBe('in-progress');
        checkInvariants(state);
      }),
      { numRuns: 200 },
    );
  });
});
