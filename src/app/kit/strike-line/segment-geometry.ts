import type { Line } from '@tictac';
import type { Segment } from './segment.model';

/** How far a board's strike line runs past its end cells, as a share of its length. */
export const OVERSHOOT = 0.22;

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
