import type { Player } from '@tictac';
import {
  DEFAULT_SIZE,
  type DotsStatus,
  type GameState,
  type Move,
  type MoveResult,
  RULES_VERSION,
  type Size,
  SIZES,
} from './models';

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

/** The size a variant names ('3', '5'), or null when it names none of the offered sizes. */
export function sizeOf(variant: string): Size | null {
  const size = Number(variant);
  return SIZES.find((offered) => offered === size) ?? null;
}

/** An empty board of `size` boxes per side, X to move. */
export function initialState(size: Size = DEFAULT_SIZE): GameState {
  return {
    rulesVersion: RULES_VERSION,
    size,
    h: Array.from({ length: (size + 1) * size }, () => null),
    v: Array.from({ length: size * (size + 1) }, () => null),
    boxes: Array.from({ length: size * size }, () => null),
    turn: 'X',
    status: { kind: 'in-progress' },
    score: { X: 0, O: 0 },
    moves: [],
    revision: 0,
  };
}

/** Whether two moves draw the same line. */
export const sameMove = (a: Move, b: Move): boolean =>
  a.orientation === b.orientation && a.row === b.row && a.col === b.col;

/** Index of a line in its array, or -1 when it is off the board. */
export function lineIndex(size: number, { orientation, row, col }: Move): number {
  const valid = [row, col].every(Number.isInteger) && row >= 0 && col >= 0;
  if (orientation === 'h') {
    return valid && row <= size && col < size ? row * size + col : -1;
  }
  return orientation === 'v' && valid && row < size && col <= size ? row * (size + 1) + col : -1;
}

/** Every line still to draw while the game is in progress: horizontals first, row by row. */
export function legalMoves(state: GameState): Move[] {
  if (state.status.kind !== 'in-progress') {
    return [];
  }
  const { size } = state;
  const h = state.h.flatMap((owner, i): Move[] =>
    owner ? [] : [{ orientation: 'h', row: Math.floor(i / size), col: i % size }],
  );
  const v = state.v.flatMap((owner, i): Move[] =>
    owner ? [] : [{ orientation: 'v', row: Math.floor(i / (size + 1)), col: i % (size + 1) }],
  );
  return [...h, ...v];
}

/** The boxes (index row * size + col) that a line borders: one on the edge, two inside. */
export function boxesBeside(size: number, { orientation, row, col }: Move): number[] {
  if (orientation === 'h') {
    return [row - 1, row].filter((r) => r >= 0 && r < size).map((r) => r * size + col);
  }
  return [col - 1, col].filter((c) => c >= 0 && c < size).map((c) => row * size + c);
}

/** Whether all four sides of box `box` are drawn. */
function complete(
  h: readonly (Player | null)[],
  v: readonly (Player | null)[],
  size: number,
  box: number,
): boolean {
  const row = Math.floor(box / size);
  const col = box % size;
  return Boolean(
    h[row * size + col] &&
    h[(row + 1) * size + col] &&
    v[row * (size + 1) + col] &&
    v[row * (size + 1) + col + 1],
  );
}

/**
 * Draws `move` for the player to move. Rejections, in order: the game is over, the line is off the
 * board, the line is already drawn. Every box the line completes goes to the mover, who then moves
 * again; otherwise the turn passes. When every line is drawn, the player with more boxes wins.
 */
export function applyMove(state: GameState, move: Move): MoveResult {
  if (state.status.kind !== 'in-progress') {
    return { ok: false, reason: 'game-over', state };
  }
  const { size } = state;
  const index = lineIndex(size, move);
  if (index < 0) {
    return { ok: false, reason: 'invalid-coordinates', state };
  }
  const lines = move.orientation === 'h' ? state.h : state.v;
  if (lines[index]) {
    return { ok: false, reason: 'line-taken', state };
  }
  const mover = state.turn;
  const drawn = lines.map((owner, i) => (i === index ? mover : owner));
  const h = move.orientation === 'h' ? drawn : state.h;
  const v = move.orientation === 'v' ? drawn : state.v;
  const closed = boxesBeside(size, move).filter((box) => complete(h, v, size, box));
  const boxes = state.boxes.map((owner, box) => (closed.includes(box) ? mover : owner));
  const score = { ...state.score, [mover]: state.score[mover] + closed.length };
  return {
    ok: true,
    closed: closed.length,
    state: {
      ...state,
      h,
      v,
      boxes,
      score,
      turn: closed.length > 0 ? mover : other(mover),
      status: statusOf(boxes, score),
      moves: [...state.moves, { orientation: move.orientation, row: move.row, col: move.col }],
      revision: state.revision + 1,
    },
  };
}

/**
 * In progress while a box is open; then the player with more boxes wins. A tie is a draw: impossible
 * on the odd boards of this version (9 and 25 boxes), kept for even sizes.
 */
export function statusOf(boxes: readonly (Player | null)[], score: GameState['score']): DotsStatus {
  if (boxes.some((owner) => owner === null)) {
    return { kind: 'in-progress' };
  }
  if (score.X === score.O) {
    return { kind: 'drawn' };
  }
  return { kind: 'won', winner: score.X > score.O ? 'X' : 'O' };
}
