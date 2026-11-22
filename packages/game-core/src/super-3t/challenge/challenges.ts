import { RULES_VERSION, type Move } from '@super3t/core';
import type { Challenge, ChallengeLevel } from './challenge.model';

/** `'4.2 2.4'`: board 4 cell 2, then board 2 cell 4 (engine coordinates, 0–8). */
function moves(notation: string): Move[] {
  return notation.split(' ').map((token) => {
    const [board = -1, cell = -1] = token.split('.').map(Number);
    return { board, cell };
  });
}

const challenge = (id: string, level: ChallengeLevel, notation: string): Challenge => ({
  id,
  level,
  rulesVersion: RULES_VERSION,
  moves: moves(notation),
});

/**
 * The challenges, easiest first. Each position was found by playing seeded games with the engine
 * and the beginner level, keeping positions with exactly one key move for X; `challenge.spec.ts`
 * asserts what makes each one fair.
 */
export const CHALLENGES: readonly Challenge[] = [
  // Forced onto board 2, seven cells. X holds boards 4 and 6 and needs 2 for the diagonal.
  challenge(
    'diagonal-2026-11',
    'easy',
    '1.3 3.4 4.4 4.6 6.5 5.4 4.8 8.5 5.7 7.8 8.8 8.0 0.0 0.2 2.2 2.4 4.0 0.1 1.5 5.1 1.4 7.6 ' +
      '6.4 7.7 6.3 3.6 8.6 3.2',
  ),
  // A free choice of ten cells. X holds boards 1 and 4 and needs 7 for the middle column.
  challenge(
    'column-2026-11',
    'medium',
    '6.3 3.6 6.6 6.1 1.8 8.4 4.2 2.4 4.4 4.5 5.8 8.0 0.0 0.6 6.0 0.5 5.5 5.0 0.7 7.4 4.6 8.8 ' +
      '5.2 2.3 3.3 3.7 7.3 3.8 7.5 2.5 1.2 1.4 1.5 0.2',
  ),
  // A free choice of eighteen cells, three of them winning a board. X needs board 7 for the row.
  challenge(
    'row-2026-11',
    'hard',
    '7.8 8.3 3.4 4.2 2.4 4.5 5.8 8.6 6.2 2.2 2.6 6.3 3.2 2.3 3.6 6.8 8.0 0.3 8.1 1.2 2.8 8.8 ' +
      '8.2 2.5 5.0 0.0 0.8 0.6 6.0 4.8 6.1 1.1 1.4 1.0',
  ),
];

/** The challenge with `id`, if there is one. */
export const findChallenge = (id: string): Challenge | undefined =>
  CHALLENGES.find((entry) => entry.id === id);
