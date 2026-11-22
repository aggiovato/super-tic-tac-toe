/** Centre, then corners, then edges: how much every level likes each cell of a board. */
const CELL_WEIGHT = [2, 1, 2, 1, 3, 1, 2, 1, 2] as const;

/** A move's cell preference (any game whose moves name a cell 0–8), for random picks and ties. */
export const cellWeight = (move: { readonly cell: number }): number => CELL_WEIGHT[move.cell] ?? 1;
