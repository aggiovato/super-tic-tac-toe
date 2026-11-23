import type { Mark, Move } from '@super3t/core';

// The strike geometry of a 3×3 grid is shared by every game.
export { clampSegment, gridStrike, overshoot } from '@ui';

/** Pure geometry of the board: indices, keyboard order and strike lines. No DOM, no Angular. */

export const INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

/** The game's strike line overshoots less and stays inside the board grid. */
export const GAME_OVERSHOOT = 0.08;

/** Index of a cell in the 9×9 reading order of the whole board. */
export const globalIndex = (board: number, cell: number): number =>
  (Math.floor(board / 3) * 3 + Math.floor(cell / 3)) * 9 + (board % 3) * 3 + (cell % 3);

/** Inverse of `globalIndex`. */
export const moveAt = (index: number): Move => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  return {
    board: Math.floor(row / 3) * 3 + Math.floor(col / 3),
    cell: (row % 3) * 3 + (col % 3),
  };
};

/** Flap character for a mark: players are drawn glyphs, empty is blank. */
export const glyphOf = (mark: Mark): string => (mark === 'X' ? 'x' : mark === 'O' ? 'o' : ' ');

/** Arrow keys as steps on a grid: rows, then columns. */
export const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/**
 * The next index of a `size`×`size` grid in the step's direction that `valid` accepts, or `index`
 * itself when there is none.
 */
export function nextValid(
  index: number,
  [dRow, dCol]: readonly [number, number],
  size: number,
  valid: (i: number) => boolean,
): number {
  let row = Math.floor(index / size) + dRow;
  let col = (index % size) + dCol;
  while (row >= 0 && row < size && col >= 0 && col < size) {
    if (valid(row * size + col)) {
      return row * size + col;
    }
    row += dRow;
    col += dCol;
  }
  return index;
}
