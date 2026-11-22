import { gameById } from '@catalog';
import type {
  GameRow,
  MoveRefusal,
  GameRoomResult,
  GameRoomScore,
  GameRoomSetup,
  GameRoomState,
  Seat,
  SeatView,
} from '../models';

/** The other seat of a room. */
export const otherSeat = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

/** Everything a move is judged against: the room, its current game and who is in it. */
export interface MoveContext {
  readonly setup: GameRoomSetup;
  readonly game: GameRow;
  /** The current game's accepted moves, in order. */
  readonly moves: readonly unknown[];
  /** The guest has taken seat 1. */
  readonly full: boolean;
}

/** A move's verdict: refused and why, or accepted, ending the game with a result or not. */
export type MoveVerdict =
  | { readonly ok: false; readonly reason: MoveRefusal }
  | { readonly ok: true; readonly result: GameRoomResult | null };

/**
 * Judges a move from `seat`, made on `expectedRevision`, with the game's own engine (`@catalog`):
 * the same rules the app plays, so a legal move in the app is legal here. Pure: no storage, no
 * clock, no socket.
 */
export function judgeMove(
  { setup, game, moves, full }: MoveContext,
  seat: Seat,
  expectedRevision: number,
  move: unknown,
): MoveVerdict {
  if (!full) return { ok: false, reason: 'waiting' };
  if (game.result) return { ok: false, reason: 'game-over' };
  if (expectedRevision !== moves.length) return { ok: false, reason: 'stale' };
  const { rules } = gameById(setup.gameId);
  const position = rules.replay(moves, setup.rulesVersion, setup.variant).state;
  if (!position) return { ok: false, reason: 'illegal' };
  const turn = position.turn === 'X' ? game.xSeat : otherSeat(game.xSeat);
  if (seat !== turn) return { ok: false, reason: 'not-your-turn' };
  let next;
  try {
    next = rules.apply(position, move);
  } catch {
    // A move that is not this game's move at all makes the engine throw.
    return { ok: false, reason: 'illegal' };
  }
  if (!next.ok) return { ok: false, reason: 'illegal' };
  const { status } = next.state;
  if (status.kind === 'in-progress') return { ok: true, result: null };
  if (status.kind === 'drawn') return { ok: true, result: 'draw' };
  return {
    ok: true,
    result: status.winner === 'X' ? `won-${game.xSeat}` : `won-${otherSeat(game.xSeat)}`,
  };
}

/** The next game after `finished` asked for a rematch, symbols swapped; null when not the time. */
export function nextGame(current: GameRow, finished: number): { game: number; xSeat: Seat } | null {
  return current.game === finished && current.result
    ? { game: current.game + 1, xSeat: otherSeat(current.xSeat) }
    : null;
}

/** What a seat's player receives: the room's whole state, as that seat sees it. */
export function gameRoomView(
  room: {
    readonly setup: GameRoomSetup;
    readonly game: GameRow;
    readonly moves: readonly unknown[];
    readonly score: GameRoomScore;
    readonly taken: readonly Seat[];
    readonly online: ReadonlySet<Seat>;
  },
  you: Seat,
): GameRoomState {
  const seat = (s: Seat): SeatView => ({
    taken: room.taken.includes(s),
    online: room.online.has(s),
  });
  return {
    type: 'state',
    ...room.setup,
    game: room.game.game,
    xSeat: room.game.xSeat,
    moves: room.moves,
    revision: room.moves.length,
    result: room.game.result,
    score: room.score,
    seats: [seat(0), seat(1)],
    you,
  };
}
