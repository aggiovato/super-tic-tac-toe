import type { Player } from '@tictac';
import { cellIndex, fleetProblem, normalizeFleet, sameFleet, shipAt, shipCells } from './fleet';
import {
  BOARD_SIZE,
  type Cell,
  type Fleet,
  type FleetStatus,
  type GameState,
  type Move,
  type MoveResult,
  RULES_VERSION,
  SHIP_IDS,
  type Shot,
} from './models';

export const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

/**
 * Both waters empty and both fleets still to place; X will fire first. A whole game by default, or
 * the view of `viewer` (see `GameState.viewer`).
 */
export function initialState(viewer: Player | null = null): GameState {
  return {
    rulesVersion: RULES_VERSION,
    viewer,
    phase: 'placing',
    fleets: { X: null, O: null },
    placed: { X: false, O: false },
    shots: { X: [], O: [] },
    turn: 'X',
    status: { kind: 'in-progress' },
    moves: [],
    revision: 0,
  };
}

/** Whether two moves are the same: the same fleet for the same player, or a shot at the same cell. */
export function sameMove(a: Move, b: Move): boolean {
  if (a.kind === 'place' && b.kind === 'place') {
    return a.player === b.player && sameFleet(a.fleet ?? [], b.fleet ?? []);
  }
  return a.kind === 'shot' && b.kind === 'shot' && a.row === b.row && a.col === b.col;
}

/** Whether `player` fired at `cell` already. */
export const fired = (state: GameState, player: Player, cell: Cell): boolean =>
  state.shots[player].some((shot) => shot.row === cell.row && shot.col === cell.col);

/** Whether `player`'s last shot waits for its outcome (only in a view). */
const waiting = (state: GameState, player: Player): boolean =>
  state.shots[player].at(-1)?.outcome === 'pending';

/**
 * Every shot the player to move may fire while the game is firing, row by row. Placing a fleet has
 * too many forms to list: a player places with `applyMove` and `fleetProblem` says what is wrong.
 */
export function legalMoves(state: GameState): Move[] {
  if (state.phase !== 'firing' || waiting(state, state.turn)) {
    return [];
  }
  const moves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!fired(state, state.turn, { row, col })) moves.push({ kind: 'shot', row, col });
    }
  }
  return moves;
}

/**
 * Whether `player` may move now: either may place their fleet while it is not placed; then only the
 * one to fire, and not while their last shot waits for its outcome.
 */
export function mayMove(state: GameState, player: Player): boolean {
  if (state.phase === 'placing') return !state.placed[player];
  return state.phase === 'firing' && state.turn === player && !waiting(state, player);
}

/**
 * Plays a move. A placement: refused once the game is over, when that player placed already (or
 * the firing began), or when the fleet breaks a rule (`fleetProblem`); the firing starts once both
 * fleets are placed. A shot by the player to move: refused once the game is over, while a fleet is
 * still to place, off the board, on a cell that player fired at, or (in a view) while the last shot
 * waits for its outcome. A hit or a sinking shot fires again; water passes the turn; sinking the last
 * ship wins.
 *
 * In a view, the rival's placement comes without its fleet, and a shot at the hidden fleet takes the
 * outcome it came with, or is pending without one.
 */
export function applyMove(state: GameState, move: Move): MoveResult {
  if (state.status.kind !== 'in-progress') {
    return { ok: false, reason: 'game-over', state };
  }
  return move.kind === 'place' ? place(state, move.player, move.fleet) : shoot(state, move);
}

function place(state: GameState, player: Player, fleet: Fleet | undefined): MoveResult {
  if (state.phase !== 'placing' || state.placed[player]) {
    return { ok: false, reason: 'already-placed', state };
  }
  // Only a view may take a placement without its fleet, and only the rival's.
  const hidden = fleet === undefined && state.viewer !== null && state.viewer !== player;
  if (!hidden && (fleet === undefined || fleetProblem(fleet) !== null)) {
    return { ok: false, reason: 'invalid-fleet', state };
  }
  const shown = fleet === undefined ? null : normalizeFleet(fleet);
  const placed = { ...state.placed, [player]: true };
  return {
    ok: true,
    state: {
      ...state,
      fleets: { ...state.fleets, [player]: shown },
      placed,
      phase: placed.X && placed.O ? 'firing' : 'placing',
      moves: [
        ...state.moves,
        shown ? { kind: 'place', player, fleet: shown } : { kind: 'place', player },
      ],
      revision: state.revision + 1,
    },
  };
}

function shoot(state: GameState, move: Move & { kind: 'shot' }): MoveResult {
  if (state.phase !== 'firing') {
    return { ok: false, reason: 'placing', state };
  }
  if (cellIndex(move) < 0) {
    return { ok: false, reason: 'invalid-coordinates', state };
  }
  const mover = state.turn;
  if (waiting(state, mover)) {
    return { ok: false, reason: 'pending', state };
  }
  if (fired(state, mover, move)) {
    return { ok: false, reason: 'already-shot', state };
  }
  const shot = outcomeOf(state, move);
  const shots = { ...state.shots, [mover]: [...state.shots[mover], shot] };
  const status = statusOf(shots[mover], mover);
  const { row, col } = move;
  // The whole game stores bare shots (the engine knows what they did); a view keeps the outcome
  // it was given, since it could not work it out again.
  const stored: Move =
    state.viewer === null || shot.outcome === 'pending'
      ? { kind: 'shot', row, col }
      : { kind: 'shot', ...shot, outcome: shot.outcome };
  return {
    ok: true,
    shot,
    state: {
      ...state,
      shots,
      status,
      phase: status.kind === 'won' ? 'over' : 'firing',
      turn: shot.outcome === 'water' ? other(mover) : mover,
      moves: [...state.moves, stored],
      revision: state.revision + 1,
    },
  };
}

/**
 * What a shot did: worked out against the target fleet when it is known, as the whole game always
 * knows it; in a view, the outcome the shot came with, or pending.
 */
function outcomeOf(state: GameState, move: Move & { kind: 'shot' }): Shot {
  const target = state.fleets[other(state.turn)];
  const { row, col } = move;
  if (state.viewer === null || (target && move.outcome === undefined)) {
    // The whole game always knows both fleets once firing.
    return resolveShot(target ?? [], state.shots[state.turn], move);
  }
  if (move.outcome === undefined) return { row, col, outcome: 'pending' };
  if (!move.sunk) return { row, col, outcome: move.outcome };
  const { ship, orientation } = move.sunk;
  return {
    row,
    col,
    outcome: move.outcome,
    sunk: { ship, row: move.sunk.row, col: move.sunk.col, orientation },
  };
}

/** What a shot at `cell` does to `fleet`, given the shots fired at it before. */
export function resolveShot(fleet: Fleet, before: readonly Shot[], cell: Cell): Shot {
  const { row, col } = cell;
  const ship = shipAt(fleet, cell);
  if (!ship) return { row, col, outcome: 'water' };
  const hit = (part: Cell) =>
    (part.row === row && part.col === col) ||
    before.some((shot) => shot.row === part.row && shot.col === part.col);
  return shipCells(ship).every(hit)
    ? { row, col, outcome: 'sunk', sunk: ship }
    : { row, col, outcome: 'hit' };
}

/** Won by `mover` once their shots sank every ship; in progress otherwise. */
export function statusOf(shots: readonly Shot[], mover: Player): FleetStatus {
  const sunk = shots.filter((shot) => shot.outcome === 'sunk').length;
  return sunk === SHIP_IDS.length ? { kind: 'won', winner: mover } : { kind: 'in-progress' };
}
