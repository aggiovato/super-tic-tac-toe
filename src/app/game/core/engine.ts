import { resolveBoard, resolveGame } from './resolve';
import {
  RULES_VERSION,
  type GameState,
  type Mark,
  type Move,
  type MoveResult,
  type RejectionReason,
  type Target,
} from './types';

const SIZE = 9;
const INDICES = Array.from({ length: SIZE }, (_, index) => index);

const isIndex = (value: number): boolean => Number.isInteger(value) && value >= 0 && value < SIZE;

/** Opening position: nine open boards, X to move anywhere. */
export function initialState(): GameState {
  return {
    rulesVersion: RULES_VERSION,
    cells: INDICES.map(() => INDICES.map((): Mark => null)),
    boards: INDICES.map(() => ({ kind: 'open' })),
    turn: 'X',
    target: { kind: 'free' },
    status: { kind: 'in-progress' },
    moves: [],
    revision: 0,
  };
}

/** Every legal move, ordered by board and then cell. A terminal position has none. */
export function legalMoves(state: GameState): Move[] {
  const { target } = state;
  if (target.kind === 'game-over') {
    return [];
  }
  const boards =
    target.kind === 'forced'
      ? [target.board]
      : INDICES.filter((board) => state.boards[board].kind === 'open');
  return boards.flatMap((board) =>
    INDICES.filter((cell) => state.cells[board][cell] === null).map((cell) => ({ board, cell })),
  );
}

/** Why `move` is illegal in `state`, checked in rule order, or null when it is legal. */
function rejectionFor(state: GameState, { board, cell }: Move): RejectionReason | null {
  if (state.status.kind !== 'in-progress') {
    return 'game-over';
  }
  if (!isIndex(board) || !isIndex(cell)) {
    return 'invalid-coordinates';
  }
  if (state.boards[board].kind !== 'open') {
    return 'board-closed';
  }
  if (state.target.kind === 'forced' && state.target.board !== board) {
    return 'wrong-board';
  }
  if (state.cells[board][cell] !== null) {
    return 'cell-occupied';
  }
  return null;
}

/**
 * Applies `move` for the player to move. Never mutates `state`: a legal move returns a new state,
 * an illegal one returns the same state with the reason.
 */
export function applyMove(state: GameState, move: Move): MoveResult {
  const reason = rejectionFor(state, move);
  if (reason) {
    return { ok: false, reason, state };
  }

  const { board, cell } = move;
  const mover = state.turn;
  const boardCells = state.cells[board].map((mark, index) => (index === cell ? mover : mark));
  const cells = state.cells.map((current, index) => (index === board ? boardCells : current));
  const boards = state.boards.map((current, index) =>
    index === board ? resolveBoard(boardCells, mover) : current,
  );
  const status = resolveGame(boards, mover);

  // The target is computed after local closing: a cell pointing to a closed board frees the choice.
  const target: Target =
    status.kind !== 'in-progress'
      ? { kind: 'game-over' }
      : boards[cell].kind === 'open'
        ? { kind: 'forced', board: cell }
        : { kind: 'free' };

  return {
    ok: true,
    state: {
      rulesVersion: state.rulesVersion,
      cells,
      boards,
      turn: mover === 'X' ? 'O' : 'X',
      target,
      status,
      moves: [...state.moves, { board, cell }],
      revision: state.revision + 1,
    },
  };
}
