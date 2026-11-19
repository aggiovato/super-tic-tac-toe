import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves, type GameState, type Move } from '@core';
import { CLOSES_OWN_TARGET, GLOBAL_DIAGONAL_WIN, parseMoves, play } from '@core/testing';
import type { Level } from './models';
import { chooseMove } from './opponent';
import { winningMoves } from './tactics';

const beginner = (state: GameState, seed: number) => chooseMove(state, { level: 'beginner', seed });
const notation = (move: Move | null) => (move ? `${move.board}.${move.cell}` : null);
const allBut = (moves: string, drop = 1) =>
  parseMoves(moves)
    .slice(0, -drop)
    .map((move) => `${move.board}.${move.cell}`)
    .join(' ');
const includes = (moves: readonly Move[], move: Move | null) =>
  moves.some((candidate) => candidate.board === move?.board && candidate.cell === move.cell);

/** Plays a legal move; the generator only picks from `legalMoves`, so a rejection is a bug. */
const advance = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(`The engine rejected a legal move: ${result.reason}`);
  }
  return result.state;
};

const SEEDS = Array.from({ length: 50 }, (_, index) => index + 1);

/**
 * X to move with a free choice: 8.0 wins board 8 only, 4.2 wins board 4 and with it the game.
 * Found by playing seeded random games with the engine.
 */
const BOARD_OR_GAME_WIN =
  '5.5 5.0 0.4 4.8 8.8 8.2 2.5 5.7 7.3 3.8 8.4 4.3 3.1 1.3 3.2 2.1 1.4 4.0 0.3 3.6 6.2 2.2 2.0 ' +
  '0.2 2.6 6.7 7.2 2.3 3.5 5.4 4.6 6.1 1.7 7.5 5.6 6.8 8.1 1.6 6.0 0.1 1.2 2.4 4.1 1.5 5.3 3.0 ' +
  '0.5 5.1 1.1 8.3 3.3 3.7 7.7 7.4 4.4 4.7 7.8 8.7 7.6 6.6';

/** The eight rotations and reflections of a 3×3 grid, as index maps. */
const SYMMETRIES: readonly (readonly number[])[] = (() => {
  const rotate = (i: number) => (i % 3) * 3 + (2 - Math.floor(i / 3));
  const mirror = (i: number) => Math.floor(i / 3) * 3 + (2 - (i % 3));
  const maps: number[][] = [];
  let map = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let turn = 0; turn < 4; turn++) {
    maps.push(map, map.map(mirror));
    map = map.map(rotate);
  }
  return maps;
})();

/** The same game seen through a symmetry: boards and cells transform alike, so it stays legal. */
const transform = (moves: string, map: readonly number[]): string =>
  parseMoves(moves)
    .map(({ board, cell }) => `${map[board]}.${map[cell]}`)
    .join(' ');

describe('beginner opponent', () => {
  it('has no move once the game is over', () => {
    expect(beginner(play(GLOBAL_DIAGONAL_WIN), 1)).toBeNull();
  });

  it('wins a board when one move does it, whatever the seed', () => {
    // X is sent to board 2 holding cells 0 and 1: only 2.2 closes it.
    const state = play(allBut(CLOSES_OWN_TARGET));
    for (const seed of SEEDS) {
      expect(notation(beginner(state, seed))).toBe('2.2');
    }
  });

  it('wins the game rather than just another board', () => {
    const state = play(BOARD_OR_GAME_WIN);
    for (const seed of SEEDS) {
      expect(notation(beginner(state, seed))).toBe('4.2');
    }
  });

  it('finds the same win in every rotation and reflection of the position', () => {
    const position = allBut(CLOSES_OWN_TARGET);
    for (const map of SYMMETRIES) {
      const expected = `${map[2]}.${map[2]}`;
      expect(notation(beginner(play(transform(position, map)), 5))).toBe(expected);
    }
    expect(new Set(SYMMETRIES.map((map) => map.join())).size).toBe(8);
  });

  it('repeats its move for the same seed and varies it across seeds', () => {
    const opening = initialState();
    expect(beginner(opening, 123)).toEqual(beginner(opening, 123));
    const distinct = new Set(SEEDS.map((seed) => notation(beginner(opening, seed))));
    expect(distinct.size).toBeGreaterThan(20);
  });

  it('prefers centres, then corners, then edges when nothing wins', () => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let seed = 0; seed < 3000; seed++) {
      const move = beginner(initialState(), seed);
      expect(move).not.toBeNull();
      if (move) {
        counts[move.cell] = (counts[move.cell] ?? 0) + 1;
      }
    }
    const [corner, edge, centre] = [counts[0] ?? 0, counts[1] ?? 0, counts[4] ?? 0];
    expect(centre).toBeGreaterThan(corner);
    expect(corner).toBeGreaterThan(edge);
  });

  it('refuses an unknown level and a fractional seed instead of guessing', () => {
    const opening = initialState();
    expect(() => chooseMove(opening, { level: 'expert' as unknown as Level, seed: 1 })).toThrow(
      /Unknown opponent level/,
    );
    expect(() => beginner(opening, 0.37)).toThrow(/integer/);
  });

  it('answers legally and keeps its priorities at every position of generated games', () => {
    const check = (state: GameState, seed: number): void => {
      const reply = beginner(state, seed);
      if (state.status.kind !== 'in-progress') {
        expect(reply).toBeNull();
        return;
      }
      expect(includes(legalMoves(state), reply)).toBe(true);
      const wins = winningMoves(state);
      if (wins.game.length > 0) {
        expect(includes(wins.game, reply)).toBe(true);
      } else if (wins.board.length > 0) {
        expect(includes(wins.board, reply)).toBe(true);
      }
    };
    fc.assert(
      fc.property(
        fc.array(fc.nat(), { minLength: 81, maxLength: 81 }),
        fc.integer(),
        (picks, seed) => {
          let state = initialState();
          for (const pick of picks) {
            check(state, seed);
            const legal = legalMoves(state);
            if (legal.length === 0) {
              return;
            }
            state = advance(state, legal[pick % legal.length]);
          }
        },
      ),
      { numRuns: 60 },
    );
  });
});
