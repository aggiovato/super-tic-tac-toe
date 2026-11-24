import type { Player } from '@tictac';
import { applyMove, initialState, other, statusOf } from './engine';
import {
  type Fleet,
  type FleetStatus,
  type GameState,
  type Outcome,
  type PerPlayer,
  type Phase,
  RULES_VERSION,
  type ShipPlacement,
  type Shot,
} from './models';

/**
 * A move as one player may see it: their own placement in full, the rival's only as the fact that
 * it happened (in full once the game is over), and every shot with what it did, a sinking shot with
 * the ship it sank. This is what the server sends each seat: nothing in it locates a rival ship that
 * still floats.
 */
export type ViewMove =
  | { readonly kind: 'place'; readonly player: Player; readonly fleet?: Fleet }
  | {
      readonly kind: 'shot';
      readonly row: number;
      readonly col: number;
      readonly outcome: Outcome;
      readonly sunk?: ShipPlacement;
    };

/** What one player knows of a game: everything but where the rival's floating ships are. */
export interface FleetView {
  readonly rulesVersion: number;
  /** The player this view belongs to. */
  readonly viewer: Player;
  readonly phase: Phase;
  readonly turn: Player;
  readonly status: FleetStatus;
  /** The viewer's fleet once placed; the rival's only once the game is over. */
  readonly fleets: PerPlayer<Fleet | null>;
  /** Whether each player has placed their fleet. */
  readonly placed: PerPlayer<boolean>;
  /** The shots each player fired, with what they did. */
  readonly shots: PerPlayer<readonly Shot[]>;
  /** The moves as the viewer sees them; replaying them rebuilds this view. */
  readonly moves: readonly ViewMove[];
  readonly revision: number;
}

/** The view of `viewer` over a full game state. */
export function viewOf(state: GameState, viewer: Player): FleetView {
  const over = state.phase === 'over';
  return {
    rulesVersion: state.rulesVersion,
    viewer,
    phase: state.phase,
    turn: state.turn,
    status: state.status,
    fleets: {
      X: viewer === 'X' || over ? state.fleets.X : null,
      O: viewer === 'O' || over ? state.fleets.O : null,
    },
    placed: { X: state.fleets.X !== null, O: state.fleets.O !== null },
    shots: state.shots,
    moves: redactMoves(state, viewer),
    revision: state.revision,
  };
}

/**
 * A game's moves as `viewer` may see them (see `ViewMove`). The state must come from replaying its
 * own moves, as every state of the engine does.
 */
export function redactMoves(state: GameState, viewer: Player): ViewMove[] {
  const over = state.phase === 'over';
  const seen: ViewMove[] = [];
  let walk = initialState();
  for (const move of state.moves) {
    const mover = walk.turn;
    const result = applyMove(walk, move);
    if (!result.ok) throw new Error(`redactMoves: an illegal move (${result.reason})`);
    walk = result.state;
    if (move.kind === 'place') {
      const shown = move.player === viewer || over;
      seen.push(
        shown
          ? { kind: 'place', player: move.player, fleet: move.fleet }
          : { kind: 'place', player: move.player },
      );
    } else {
      // The shot just fired is the last of the mover's.
      seen.push({ kind: 'shot', ...walk.shots[mover].at(-1)! });
    }
  }
  return seen;
}

export type ViewReplayResult =
  | { readonly ok: true; readonly view: FleetView }
  | { readonly ok: false; readonly reason: 'unsupported-rules-version' | 'inconsistent' };

/**
 * Rebuilds `viewer`'s view from the moves they were sent (`redactMoves`), without knowing the rival's
 * fleet: shots keep the outcome they came with. Refuses moves no game could produce (a shot before
 * both fleets, a placement twice, a move after the end).
 */
export function replayView(
  moves: readonly ViewMove[],
  rulesVersion: number,
  viewer: Player,
): ViewReplayResult {
  if (rulesVersion !== RULES_VERSION) {
    return { ok: false, reason: 'unsupported-rules-version' };
  }
  let view = emptyView(viewer);
  for (const move of moves) {
    const next = move.kind === 'place' ? placeSeen(view, move) : shotSeen(view, move);
    if (!next) return { ok: false, reason: 'inconsistent' };
    view = { ...next, moves: [...view.moves, move], revision: view.revision + 1 };
  }
  return { ok: true, view };
}

function emptyView(viewer: Player): FleetView {
  const start = initialState();
  return {
    rulesVersion: RULES_VERSION,
    viewer,
    phase: start.phase,
    turn: start.turn,
    status: start.status,
    fleets: start.fleets,
    placed: { X: false, O: false },
    shots: start.shots,
    moves: [],
    revision: 0,
  };
}

function placeSeen(view: FleetView, move: ViewMove & { kind: 'place' }): FleetView | null {
  if (view.phase !== 'placing' || view.placed[move.player]) return null;
  const placed = { ...view.placed, [move.player]: true };
  return {
    ...view,
    placed,
    fleets: move.fleet ? { ...view.fleets, [move.player]: move.fleet } : view.fleets,
    phase: placed.X && placed.O ? 'firing' : 'placing',
  };
}

function shotSeen(view: FleetView, move: ViewMove & { kind: 'shot' }): FleetView | null {
  if (view.phase !== 'firing') return null;
  const mover = view.turn;
  const { row, col, outcome, sunk } = move;
  const shot: Shot = sunk ? { row, col, outcome, sunk } : { row, col, outcome };
  const shots = { ...view.shots, [mover]: [...view.shots[mover], shot] };
  const status = statusOf(shots[mover], mover);
  return {
    ...view,
    shots,
    status,
    phase: status.kind === 'won' ? 'over' : 'firing',
    turn: outcome === 'water' ? other(mover) : mover,
  };
}
