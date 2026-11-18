import { applyMove, initialState } from '../engine';
import type { GameState, Move } from '../models';

/** Parses readable fixtures: `'4.2 2.4'` is X on board 4 cell 2, then O on board 2 cell 4. */
export function parseMoves(notation: string): Move[] {
  return notation
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const [board, cell] = token.split('.').map(Number);
      if (board === undefined || cell === undefined || token.split('.').length !== 2) {
        throw new Error(`Invalid move token "${token}"`);
      }
      return { board, cell };
    });
}

/** Plays a fixture from the opening and fails loudly on the first illegal move. */
export function play(notation: string, from: GameState = initialState()): GameState {
  return parseMoves(notation).reduce((state, move, index) => {
    const result = applyMove(state, move);
    if (!result.ok) {
      throw new Error(`Move ${index} (${move.board}.${move.cell}) rejected: ${result.reason}`);
    }
    return result.state;
  }, from);
}

/**
 * Text picture of the position for snapshots: the 9×9 grid with mini boards separated, then the
 * status of each board, the target and the turn.
 */
export function formatState(state: GameState): string {
  const rows: string[] = [];
  for (let bigRow = 0; bigRow < 3; bigRow++) {
    if (bigRow > 0) {
      rows.push('------+-------+------');
    }
    for (let smallRow = 0; smallRow < 3; smallRow++) {
      const groups = [0, 1, 2].map((bigCol) => {
        const board = bigRow * 3 + bigCol;
        return [0, 1, 2]
          .map((smallCol) => state.cells[board]?.[smallRow * 3 + smallCol] ?? '.')
          .join(' ');
      });
      rows.push(groups.join(' | '));
    }
  }
  const boards = state.boards
    .map((board, index) => {
      const label = board.kind === 'won' ? board.winner : board.kind === 'drawn' ? '=' : '_';
      return `${index}:${label}`;
    })
    .join(' ');
  const target = state.target.kind === 'forced' ? `board ${state.target.board}` : state.target.kind;
  const status = state.status.kind === 'won' ? `${state.status.winner} wins` : state.status.kind;
  return [
    ...rows,
    '',
    `boards ${boards}`,
    `target ${target}`,
    `turn ${state.turn}`,
    `status ${status}`,
  ].join('\n');
}
