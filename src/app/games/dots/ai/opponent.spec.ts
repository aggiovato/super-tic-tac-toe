import { applyMove, type GameState, initialState, legalMoves, type Move } from '@dots/core';
import type { Player } from '@tictac';
import { describe, expect, it } from 'vitest';
import { Board } from './board';
import { chooseMove, LEVELS, type Level } from './opponent';

const h = (row: number, col: number): Move => ({ orientation: 'h', row, col });
const v = (row: number, col: number): Move => ({ orientation: 'v', row, col });

const next = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.state;
};

const play = (moves: readonly Move[], size: 3 | 5 = 3): GameState =>
  moves.reduce(next, initialState(size));

/** A clock that allows `readings` reads, then is always past any deadline: work, not time. */
const counter = (readings: number) => {
  let read = 0;
  return () => (read++ < readings ? 0 : Number.MAX_SAFE_INTEGER);
};

/** Plays a whole game between two levels; returns the winner, or null for a draw. */
function game(x: Level, o: Level, seed: number, size: 3 | 5 = 3): Player | null {
  let state = initialState(size);
  while (state.status.kind === 'in-progress') {
    const level = state.turn === 'X' ? x : o;
    const move = chooseMove(state, { level, seed, now: counter(400_000) });
    if (!move) {
      throw new Error('no move while the game goes on');
    }
    state = next(state, move);
  }
  return state.status.kind === 'won' ? state.status.winner : null;
}

/** Brute force without memo: the best final margin for the player to move (independent oracle). */
function oracle(state: GameState, memo = new Map<string, number>()): number {
  if (state.status.kind !== 'in-progress') {
    return 0;
  }
  // Memoised by the drawn lines; still the engine alone, independent of the opponent's search.
  const key = [...state.h, ...state.v].map((owner) => (owner ? 1 : 0)).join('');
  const known = memo.get(key);
  if (known !== undefined) {
    return known;
  }
  let best = -Infinity;
  for (const move of legalMoves(state)) {
    const result = applyMove(state, move);
    if (!result.ok) {
      continue;
    }
    const value =
      result.closed > 0 ? result.closed + oracle(result.state, memo) : -oracle(result.state, memo);
    best = Math.max(best, value);
  }
  memo.set(key, best);
  return best;
}

/** A position reached by a seeded walk that closes nothing, with `left` lines still to draw. */
function late(seed: number, left: number): GameState {
  let state = initialState(3);
  let n = seed;
  while (legalMoves(state).length > left) {
    const legal = legalMoves(state);
    n = (n * 1103515245 + 12345) % 2147483648;
    state = next(state, legal[n % legal.length]);
  }
  return state;
}

describe('the Dots and Boxes opponent', () => {
  it.each(LEVELS)('always draws a legal line, on both sizes (%s)', (level) => {
    for (const size of [3, 5] as const) {
      let state = initialState(size);
      while (state.status.kind === 'in-progress') {
        const move = chooseMove(state, { level, seed: 3, now: counter(20_000) });
        expect(move && legalMoves(state)).toContainEqual(move);
        state = next(state, move!);
      }
    }
  });

  it('answers null once the game is over and refuses an unknown level', () => {
    let state = initialState(3);
    for (const move of legalMoves(state)) {
      state = next(state, move);
    }
    expect(chooseMove(state, { level: 'advanced', seed: 1 })).toBeNull();
    expect(() => chooseMove(initialState(3), { level: 'expert' as Level, seed: 1 })).toThrow(
      /Unknown level/,
    );
  });

  it.each(LEVELS)('closes a box when one is waiting (%s)', (level) => {
    // Box 0 has three sides; the fourth is v(0,1).
    const state = play([h(0, 0), h(2, 2), v(0, 0), v(2, 0), h(1, 0)]);
    expect(state.turn).toBe('O');
    expect(chooseMove(state, { level, seed: 5, now: counter(50_000) })).toEqual(v(0, 1));
  });

  it('gives nothing away while a safe line is left, from intermediate up', () => {
    // Box 0 has two sides: v(0,0) or h(1,0) would give it away; plenty of safe lines remain.
    const state = play([h(0, 0), v(0, 1)]);
    for (const level of ['intermediate', 'advanced'] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const move = chooseMove(state, { level, seed, now: counter(50_000) })!;
        const board = new Board(3, state);
        const index = board.open().find((line) => {
          const m = board.move(line);
          return m.orientation === move.orientation && m.row === move.row && m.col === move.col;
        });
        expect(index !== undefined && board.safe(index)).toBe(true);
      }
    }
  });

  it('plays the best line of a late position at the advanced level', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const state = late(seed, 12);
      const move = chooseMove(state, { level: 'advanced', seed, now: counter(400_000) });
      const result = applyMove(state, move!);
      if (!result.ok) {
        throw new Error('illegal');
      }
      const chosen =
        result.closed > 0 ? result.closed + oracle(result.state) : -oracle(result.state);
      expect(chosen).toBe(oracle(state));
    }
  }, 60_000);

  it('is stronger at each level: seeded games on 3×3, symbols alternating', () => {
    const score = (strong: Level, weak: Level, games: number): number => {
      let wins = 0;
      for (let seed = 1; seed <= games; seed++) {
        const strongIsX = seed % 2 === 1;
        const winner = strongIsX ? game(strong, weak, seed) : game(weak, strong, seed);
        wins += winner === (strongIsX ? 'X' : 'O') ? 1 : 0;
      }
      return wins;
    };
    expect(score('intermediate', 'beginner', 20)).toBeGreaterThanOrEqual(16);
    expect(score('advanced', 'intermediate', 10)).toBeGreaterThanOrEqual(7);
  });

  it('falls back to the intermediate move when the search runs out of time', () => {
    const state = late(4, 16);
    const move = chooseMove(state, { level: 'advanced', seed: 4, now: counter(3) });
    expect(legalMoves(state)).toContainEqual(move);
  });
});
