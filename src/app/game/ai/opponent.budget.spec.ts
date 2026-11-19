import { describe, expect, it, vi } from 'vitest';
import { applyMove, initialState, legalMoves, type GameState } from '@core';
import { parseMoves } from '@core/testing';
import { chooseMove } from './opponent';

// Counts the engine's work instead of timing it: a deterministic budget that does not depend on the
// machine (`.claude/rules/game.md`: tests use a node limit; real runs use a clock).
vi.mock('@core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@core')>();
  return { ...core, applyMove: vi.fn(core.applyMove) };
});

/** A 60-move game that keeps both players busy (see BOARD_OR_GAME_WIN in opponent.spec.ts). */
const LONG_GAME =
  '5.5 5.0 0.4 4.8 8.8 8.2 2.5 5.7 7.3 3.8 8.4 4.3 3.1 1.3 3.2 2.1 1.4 4.0 0.3 3.6 6.2 2.2 2.0 ' +
  '0.2 2.6 6.7 7.2 2.3 3.5 5.4 4.6 6.1 1.7 7.5 5.6 6.8 8.1 1.6 6.0 0.1 1.2 2.4 4.1 1.5 5.3 3.0 ' +
  '0.5 5.1 1.1 8.3 3.3 3.7 7.7 7.4 4.4 4.7 7.8 8.7 7.6 6.6';

const engineCalls = (state: GameState): number => {
  vi.mocked(applyMove).mockClear();
  chooseMove(state, { level: 'beginner', seed: 1 });
  return vi.mocked(applyMove).mock.calls.length;
};

describe('beginner budget', () => {
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
});
