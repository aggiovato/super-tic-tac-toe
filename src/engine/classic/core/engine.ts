import { resolveBoard, type GameStatus, type Mark, type Player } from '@tictac';
import { RULES_VERSION, type GameState, type Move, type MoveResult } from './models';

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

/** An empty board, X to move. */
export function initialState(): GameState {
  return {
    rulesVersion: RULES_VERSION,
    cells: Array.from({ length: 9 }, (): Mark => null),
    turn: 'X',
    status: { kind: 'in-progress' },
    moves: [],
    revision: 0,
  };
}

/** Every empty cell while the game is in progress. */
export function legalMoves(state: GameState): Move[] {
  if (state.status.kind !== 'in-progress') {
    return [];
  }
  return state.cells.flatMap((mark, cell) => (mark === null ? [{ cell }] : []));
}

/**
 * Plays `move` for the player to move. Rejections, checked in this order: the game is over, the
 * cell is not an integer 0–8, the cell is taken. A line wins at once, a full board with no line is
 * a draw (a line on the ninth cell wins).
 */
export function applyMove(state: GameState, move: Move): MoveResult {
  if (state.status.kind !== 'in-progress') {
    return { ok: false, reason: 'game-over', state };
  }
  if (!Number.isInteger(move.cell) || move.cell < 0 || move.cell > 8) {
    return { ok: false, reason: 'invalid-coordinates', state };
  }
  if (state.cells[move.cell] !== null) {
    return { ok: false, reason: 'cell-occupied', state };
  }
  const mover = state.turn;
  const cells = state.cells.map((mark, index) => (index === move.cell ? mover : mark));
  const board = resolveBoard(cells, mover);
  const status: GameStatus =
    board.kind === 'won'
      ? { kind: 'won', winner: board.winner, line: board.line }
      : board.kind === 'drawn'
        ? { kind: 'drawn' }
        : { kind: 'in-progress' };
  return {
    ok: true,
    state: {
      ...state,
      cells,
      turn: other(mover),
      status,
      moves: [...state.moves, { cell: move.cell }],
      revision: state.revision + 1,
    },
  };
}

/** Whether two moves are the same move. */
export const sameMove = (a: Move, b: Move): boolean => a.cell === b.cell;
