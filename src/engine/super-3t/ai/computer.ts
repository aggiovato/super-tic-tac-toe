import { legalMoves, type GameState, type Move } from '@super3t/core';
import { advancedMove } from './advanced';
import { beginnerMove } from './beginner';
import { intermediateMove } from './intermediate';
import type { Level, ComputerOptions, SearchLimits } from './models';
import { createRandom, pickWeighted, turnSeed } from '@tictac';
import { cellWeight } from '@tictac';

/** Time each level may think for, in milliseconds (`.claude/rules/game.md`). */
export const BUDGET_MS: Readonly<Record<Level, number>> = {
  beginner: 50,
  intermediate: 200,
  advanced: 600,
};

/**
 * The opponent's reply for the player to move: always a legal move, or null when the game is over.
 * A legal fallback (a weighted random move, no engine work) is ready before the level thinks, and
 * the level gets a deadline on a monotonic clock. `seed` is an integer kept for the whole game;
 * each turn mixes in the position's revision. An unknown level (e.g. from a message or saved
 * settings of another build) is refused, never guessed.
 */
export function chooseMove(
  state: GameState,
  { level, seed, now = () => performance.now() }: ComputerOptions,
): Move | null {
  const legal = legalMoves(state);
  if (legal.length === 0) {
    return null;
  }
  const random = createRandom(turnSeed(seed, state.revision));
  const budget = BUDGET_MS[level] as number | undefined;
  if (budget === undefined) {
    throw new Error(`Unknown opponent level: ${String(level)}`);
  }
  const deadline = now() + budget;
  const limits: SearchLimits = {
    fallback: pickWeighted(legal, cellWeight, random),
    expired: () => now() >= deadline,
  };
  switch (level) {
    case 'beginner':
      return beginnerMove(state, random);
    case 'intermediate':
      return intermediateMove(state, random, limits);
    case 'advanced':
      return advancedMove(state, random, limits);
  }
}
