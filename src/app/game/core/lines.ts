import type { Line, Player } from './types';

/** The eight lines of a 3×3 grid: three rows, three columns and two diagonals. */
export const LINES: readonly Line[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * First line fully owned by `player`, or null. Used on both levels: cells of a mini board and
 * owners of the mini boards.
 */
export function findLine(owners: readonly (Player | null)[], player: Player): Line | null {
  return LINES.find((line) => line.every((index) => owners[index] === player)) ?? null;
}
