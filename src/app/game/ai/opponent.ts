import { legalMoves, type GameState, type Move } from '@core';
import { beginnerMove } from './beginner';
import type { OpponentOptions } from './models';
import { createRandom, turnSeed } from './random';

/**
 * The opponent's reply for the player to move: always a legal move, or null when the game is over.
 * `seed` is an integer kept for the whole game; each turn mixes in the position's revision. An
 * unknown level (e.g. from a message or saved settings of another build) is refused, never guessed.
 */
export function chooseMove(state: GameState, { level, seed }: OpponentOptions): Move | null {
  if (legalMoves(state).length === 0) {
    return null;
  }
  const random = createRandom(turnSeed(seed, state.revision));
  switch (level) {
    case 'beginner':
      return beginnerMove(state, random);
    default:
      throw new Error(`Unknown opponent level: ${String(level satisfies never)}`);
  }
}
