import type { Move } from '@core';

/** Centre, then corners, then edges: how much every level likes each cell of a board. */
const CELL_WEIGHT = [2, 1, 2, 1, 3, 1, 2, 1, 2] as const;

/** A move's cell preference, shared by every level's random choices and tie-breaks. */
export const cellWeight = (move: Move): number => CELL_WEIGHT[move.cell] ?? 1;
