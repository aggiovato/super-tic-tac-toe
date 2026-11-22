import type { Move } from '@dots/core';
import type { LineSlot } from './line-slot.model';

/** Every line of a board of `size` boxes per side, horizontals first, row by row. */
export function slotsOf(size: number): LineSlot[] {
  const step = 100 / size;
  const slots: LineSlot[] = [];
  for (let row = 0; row <= size; row++) {
    for (let col = 0; col < size; col++) {
      slots.push(slot({ orientation: 'h', row, col }, step));
    }
  }
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size; col++) {
      slots.push(slot({ orientation: 'v', row, col }, step));
    }
  }
  return slots;
}

function slot(move: Move, step: number): LineSlot {
  const left = move.col * step;
  const top = move.row * step;
  return {
    key: `${move.orientation}${move.row}-${move.col}`,
    move,
    left,
    top,
    x: move.orientation === 'h' ? left + step / 2 : left,
    y: move.orientation === 'v' ? top + step / 2 : top,
  };
}

const DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

/**
 * The line an arrow key moves to: the nearest centre ahead in that direction, favouring lines in
 * line with the current one. Null at the edge of the board, or for another key.
 */
export function nextSlot(slots: readonly LineSlot[], from: LineSlot, key: string): LineSlot | null {
  const direction = DIRECTIONS[key];
  if (!direction) {
    return null;
  }
  const [dx, dy] = direction;
  let best: LineSlot | null = null;
  let bestScore = Infinity;
  for (const candidate of slots) {
    const ahead = (candidate.x - from.x) * dx + (candidate.y - from.y) * dy;
    if (ahead <= 0.01) {
      continue;
    }
    const aside = Math.abs((candidate.x - from.x) * dy) + Math.abs((candidate.y - from.y) * dx);
    const score = ahead + aside * 2;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/**
 * The line nearest the point (x, y), in percent of the grid, measured to the line itself (not its
 * centre), or null when none is within `reach`.
 */
export function nearestSlot(
  slots: readonly LineSlot[],
  x: number,
  y: number,
  reach: number,
): LineSlot | null {
  let best: LineSlot | null = null;
  let bestDistance = reach;
  for (const slot of slots) {
    const half =
      slot.move.orientation === 'h' ? Math.abs(slot.x - slot.left) : Math.abs(slot.y - slot.top);
    const along = slot.move.orientation === 'h' ? Math.abs(x - slot.x) : Math.abs(y - slot.y);
    const across = slot.move.orientation === 'h' ? Math.abs(y - slot.y) : Math.abs(x - slot.x);
    const distance = Math.hypot(Math.max(0, along - half), across);
    if (distance < bestDistance) {
      best = slot;
      bestDistance = distance;
    }
  }
  return best;
}
