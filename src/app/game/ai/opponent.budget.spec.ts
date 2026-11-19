import { describe, expect, it, vi } from 'vitest';
import { applyMove, initialState, legalMoves, type GameState } from '@core';
import { parseMoves } from '@core/testing';
import type { Level } from './models';
import { chooseMove } from './opponent';
import { LONG_GAME } from './testing';

// Counts the engine's work instead of timing it: a deterministic budget that does not depend on the
// machine (`.claude/rules/game.md`: tests use a node limit; real runs use a clock).
vi.mock('@core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@core')>();
  return { ...core, applyMove: vi.fn(core.applyMove) };
});

const engineCalls = (state: GameState, level: Level = 'beginner'): number => {
  vi.mocked(applyMove).mockClear();
  chooseMove(state, { level, seed: 1 });
  return vi.mocked(applyMove).mock.calls.length;
};

describe('opponent budgets', () => {
  it('applies the engine at most once per legal move, from every position of a long game', () => {
    let state = initialState();
    for (const move of parseMoves(LONG_GAME)) {
      expect(engineCalls(state)).toBeLessThanOrEqual(legalMoves(state).length);
      const result = applyMove(state, move);
      if (!result.ok) {
        throw new Error(`Fixture move rejected: ${result.reason}`);
      }
      state = result.state;
    }
  });

  it('does not touch the engine once the game is over', () => {
    const over = parseMoves(
      '8.6 6.4 4.5 5.2 2.7 7.0 0.3 3.0 0.0 0.8 8.3 3.8 8.0 0.4 4.2 2.0 0.6 6.0 4.8',
    ).reduce((state, move) => {
      const result = applyMove(state, move);
      return result.ok ? result.state : state;
    }, initialState());
    expect(over.status.kind).toBe('won');
    expect(engineCalls(over)).toBe(0);
  });

  it('lets the intermediate level look one reply ahead and no further', () => {
    // Each legal move once, then each reply to it once: one ply of lookahead.
    let state = initialState();
    for (const move of parseMoves(LONG_GAME)) {
      const replies = legalMoves(state).reduce((sum, mine) => {
        const result = applyMove(state, mine);
        return sum + (result.ok ? legalMoves(result.state).length : 0);
      }, 0);
      expect(engineCalls(state, 'intermediate')).toBeLessThanOrEqual(
        legalMoves(state).length + replies,
      );
      const result = applyMove(state, move);
      if (!result.ok) {
        throw new Error(`Fixture move rejected: ${result.reason}`);
      }
      state = result.state;
    }
  });

  it('keeps the advanced search within its clock: every engine call follows a reading', () => {
    let state = initialState();
    for (const move of parseMoves(LONG_GAME).slice(0, 40)) {
      let readings = 0;
      vi.mocked(applyMove).mockClear();
      chooseMove(state, {
        level: 'advanced',
        seed: 1,
        now: () => (readings++ < 500 ? 0 : Number.MAX_SAFE_INTEGER),
      });
      // One of the 500 readings sets the deadline; each engine call is preceded by its own reading.
      expect(vi.mocked(applyMove).mock.calls.length).toBeLessThanOrEqual(499);
      const result = applyMove(state, move);
      if (!result.ok) {
        throw new Error(`Fixture move rejected: ${result.reason}`);
      }
      state = result.state;
    }
  });
});
