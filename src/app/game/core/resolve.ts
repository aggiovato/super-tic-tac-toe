import { findLine } from './lines';
import type { BoardStatus, GameStatus, Mark, Player } from './models';

/**
 * Status of a mini board after `mover` placed a piece on it. Only the mover can have completed a
 * line, and a line beats a full board, so a win on the ninth cell is a win.
 */
export function resolveBoard(cells: readonly Mark[], mover: Player): BoardStatus {
  const line = findLine(cells, mover);
  if (line) {
    return { kind: 'won', winner: mover, line };
  }
  return cells.every((mark) => mark !== null) ? { kind: 'drawn' } : { kind: 'open' };
}

/**
 * Global status after `mover` played. Drawn boards are neutral. The game is drawn only when every
 * board is closed with no line; there is no tie-break by counting boards.
 */
export function resolveGame(boards: readonly BoardStatus[], mover: Player): GameStatus {
  const owners = boards.map((board) => (board.kind === 'won' ? board.winner : null));
  const line = findLine(owners, mover);
  if (line) {
    return { kind: 'won', winner: mover, line };
  }
  return boards.every((board) => board.kind !== 'open')
    ? { kind: 'drawn' }
    : { kind: 'in-progress' };
}
