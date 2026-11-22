import { findLine } from './lines';
import type { BoardStatus, Mark, Player } from './models';

/**
 * Status of a 3×3 grid after `mover` placed a piece on it. Only the mover can have completed a
 * line, and a line beats a full board, so a win on the ninth cell is a win.
 */
export function resolveBoard(cells: readonly Mark[], mover: Player): BoardStatus {
  const line = findLine(cells, mover);
  if (line) {
    return { kind: 'won', winner: mover, line };
  }
  return cells.every((mark) => mark !== null) ? { kind: 'drawn' } : { kind: 'open' };
}
