import { findLine, type BoardStatus, type GameStatus, type Player } from '@tictac';

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
