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
  type Phase,
  RULES_VERSION,
  SHIP_IDS,
  type Shot,
} from './models';

export const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

/** Both waters empty and both fleets still to place; X will fire first. */
export function initialState(): GameState {
  return {
    rulesVersion: RULES_VERSION,
    phase: 'placing',
    fleets: { X: null, O: null },
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
    return a.player === b.player && sameFleet(a.fleet, b.fleet);
  }
  return a.kind === 'shot' && b.kind === 'shot' && a.row === b.row && a.col === b.col;
}

/** Whether `player` fired at `cell` already. */
export const fired = (state: GameState, player: Player, cell: Cell): boolean =>
  state.shots[player].some((shot) => shot.row === cell.row && shot.col === cell.col);

/**
 * Every shot the player to move may fire while the game is firing, row by row. Placing a fleet has
 * too many forms to list: a player places with `applyMove` and `fleetProblem` says what is wrong.
 */
export function legalMoves(state: GameState): Move[] {
  if (state.phase !== 'firing') {
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

/** Whether `player` may move now: either may place their own fleet; then only the one to fire. */
export function mayMove(state: GameState, player: Player): boolean {
  if (state.phase === 'placing') return state.fleets[player] === null;
  return state.phase === 'firing' && state.turn === player;
}

/**
 * Plays a move. A placement: refused once the game is over, when that player placed already, or
 * when the fleet breaks a rule (`fleetProblem`); the firing starts once both fleets are placed. A
 * shot by the player to move: refused once the game is over, while a fleet is still to place, off
 * the board, or on a cell that player fired at. A hit or a sinking shot fires again; water passes
 * the turn; sinking the last ship wins.
 */
export function applyMove(state: GameState, move: Move): MoveResult {
  if (state.status.kind !== 'in-progress') {
    return { ok: false, reason: 'game-over', state };
  }
  return move.kind === 'place' ? place(state, move.player, move.fleet) : shoot(state, move);
}

function place(state: GameState, player: Player, fleet: Fleet): MoveResult {
  if (state.phase !== 'placing' || state.fleets[player] !== null) {
    return { ok: false, reason: 'already-placed', state };
  }
  if (fleetProblem(fleet) !== null) {
    return { ok: false, reason: 'invalid-fleet', state };
  }
  const placed = normalizeFleet(fleet);
  const fleets = { ...state.fleets, [player]: placed };
  const phase: Phase = fleets.X && fleets.O ? 'firing' : 'placing';
  return {
    ok: true,
    state: {
      ...state,
      fleets,
      phase,
      moves: [...state.moves, { kind: 'place', player, fleet: placed }],
      revision: state.revision + 1,
    },
  };
}

function shoot(state: GameState, cell: Cell): MoveResult {
  const target = state.fleets[other(state.turn)];
  if (state.phase !== 'firing' || !target) {
    return { ok: false, reason: 'placing', state };
  }
  if (cellIndex(cell) < 0) {
    return { ok: false, reason: 'invalid-coordinates', state };
  }
  const mover = state.turn;
  if (fired(state, mover, cell)) {
    return { ok: false, reason: 'already-shot', state };
  }
  const shot = resolveShot(target, state.shots[mover], cell);
  const shots = { ...state.shots, [mover]: [...state.shots[mover], shot] };
  const status = statusOf(shots[mover], mover);
  return {
    ok: true,
    shot,
    state: {
      ...state,
      shots,
      status,
      phase: status.kind === 'won' ? 'over' : 'firing',
      turn: shot.outcome === 'water' ? other(mover) : mover,
      moves: [...state.moves, { kind: 'shot', row: cell.row, col: cell.col }],
      revision: state.revision + 1,
    },
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
