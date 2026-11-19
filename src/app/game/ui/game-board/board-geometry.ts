import type { Line, Mark, Move } from '@core';
import type { Segment } from '@kit';

/** Pure geometry of the board: indices, keyboard order and strike lines. No DOM, no Angular. */

export const INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

/** How far a board's strike line overshoots its outer marks, as a share of its length. */
export const OVERSHOOT = 0.22;
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

/** Segment from `a` to `b` (percent points), overshooting both ends. */
export const overshoot = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  share = OVERSHOOT,
): Segment => ({
  x1: a.x - (b.x - a.x) * share,
  y1: a.y - (b.y - a.y) * share,
  x2: b.x + (b.x - a.x) * share,
  y2: b.y + (b.y - a.y) * share,
});

/** Keeps a segment's ends inside its container (percent), so a line never runs onto the page. */
export const clampSegment = (segment: Segment): Segment => {
  const clamp = (value: number): number => Math.min(99, Math.max(1, value));
  return {
    x1: clamp(segment.x1),
    y1: clamp(segment.y1),
    x2: clamp(segment.x2),
    y2: clamp(segment.y2),
  };
};

/** Segment through the centres of a line of a 3×3 grid, in percent of the grid. */
export const gridStrike = (line: Line): Segment => {
  const centre = (i: number) => ({
    x: ((i % 3) * 2 + 1) * (100 / 6),
    y: (Math.floor(i / 3) * 2 + 1) * (100 / 6),
  });
  return overshoot(centre(line[0]), centre(line[2]));
};
