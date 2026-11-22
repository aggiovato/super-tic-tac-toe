import { applyMove, initialState, legalMoves, type GameState, type Move } from '@classic/core';
import type { Player } from '@tictac';
import { describe, expect, it } from 'vitest';
import { bestMoves, chooseMove, LEVELS, type Level } from './computer';

const play = (...cells: number[]): GameState =>
  cells.reduce((state, cell) => {
    const result = applyMove(state, { cell });
    if (!result.ok) {
      throw new Error(`cell ${cell} refused: ${result.reason}`);
    }
    return result.state;
  }, initialState());

const next = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.state;
};

/**
 * Plays every possible sequence of the other side against `level` playing `side`, and returns the
 * worst result `level` reaches.
 */
function worstFor(level: Level, side: Player, seed: number): 'won' | 'drawn' | 'lost' {
  let worst: 'won' | 'drawn' | 'lost' = 'won';
  const visit = (state: GameState): void => {
    if (state.status.kind === 'won') {
      if (state.status.winner !== side) {
        worst = 'lost';
      }
      return;
    }
    if (state.status.kind === 'drawn') {
      worst = worst === 'won' ? 'drawn' : worst;
      return;
    }
    if (state.turn === side) {
      const move = chooseMove(state, { level, seed });
      if (move) {
        visit(next(state, move));
      }
      return;
    }
    legalMoves(state).forEach((move) => visit(next(state, move)));
  };
  visit(initialState());
  return worst;
}

describe('the classic opponent', () => {
  it.each(LEVELS)('always answers with a legal move (%s)', (level) => {
    for (let seed = 1; seed <= 20; seed++) {
      let state = initialState();
      while (state.status.kind === 'in-progress') {
        const move = chooseMove(state, { level, seed });
        if (!move) {
          throw new Error('no move while the game goes on');
        }
        expect(legalMoves(state)).toContainEqual(move);
        state = next(state, move);
      }
    }
  });

  it('answers null once the game is over and refuses an unknown level', () => {
    expect(chooseMove(play(0, 3, 1, 4, 2), { level: 'advanced', seed: 1 })).toBeNull();
    expect(() => chooseMove(initialState(), { level: 'expert' as Level, seed: 1 })).toThrow(
      /Unknown level/,
    );
  });

  it.each(LEVELS)('wins in one move when it can (%s)', (level) => {
    // X: 0, 1 · O: 3, 4 · X to move wins on 2.
    expect(chooseMove(play(0, 3, 1, 4), { level, seed: 7 })).toEqual({ cell: 2 });
  });

  it('blocks the winning cell from intermediate up, the beginner does not look', () => {
    // X: 0, 1 · O: 4 · O to move must block 2.
    const state = play(0, 4, 1);
    for (let seed = 1; seed <= 10; seed++) {
      expect(chooseMove(state, { level: 'intermediate', seed })).toEqual({ cell: 2 });
    }
    const beginner = new Set(
      Array.from({ length: 30 }, (_, seed) => chooseMove(state, { level: 'beginner', seed })?.cell),
    );
    expect(beginner.size).toBeGreaterThan(1);
  });

  it.each(['X', 'O'] as const)('never loses at the advanced level, playing %s', (side) => {
    for (const seed of [1, 2, 3]) {
      expect(worstFor('advanced', side, seed)).not.toBe('lost');
    }
  });

  it('can be beaten below the advanced level', () => {
    expect(worstFor('beginner', 'O', 1)).toBe('lost');
    expect(worstFor('intermediate', 'O', 1)).toBe('lost');
  });

  it('knows the opening is a draw: every first move keeps it', () => {
    expect(bestMoves(initialState())).toHaveLength(9);
    // After X in a corner, only the centre keeps the draw for O.
    expect(bestMoves(play(0))).toEqual([{ cell: 4 }]);
  });
});
