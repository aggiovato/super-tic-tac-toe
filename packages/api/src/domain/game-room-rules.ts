import { gameById } from '@catalog';
import type { Player } from '@tictac';
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

/**
 * A move's verdict: refused and why, or accepted, ending the game with a result or not. An
 * accepted move comes back as the engine stored it (only its own fields), which is what the room
 * keeps: never the client's message as it was sent.
 */
export type MoveVerdict =
  | { readonly ok: false; readonly reason: MoveRefusal }
  | { readonly ok: true; readonly result: GameRoomResult | null; readonly move: unknown };

/** The symbol a seat plays in a game where `xSeat` plays X. */
const symbolOf = (seat: Seat, xSeat: Seat): Player => (seat === xSeat ? 'X' : 'O');

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
  const { rules } = gameById(setup.gameId);
  const stale = expectedRevision !== moves.length;
  if (stale && !madeAtOnce(setup, moves, expectedRevision)) return { ok: false, reason: 'stale' };
  const position = rules.replay(moves, setup.rulesVersion, setup.variant).state;
  if (!position) return { ok: false, reason: 'illegal' };
  const may = mayPlay(rules, position, symbolOf(seat, game.xSeat), move);
  if (may !== true) {
    return { ok: false, reason: stale && may === 'not-your-turn' ? 'stale' : may };
  }
  let next;
  try {
    next = rules.apply(position, move);
  } catch {
    // A move that is not this game's move at all makes the engine throw.
    return { ok: false, reason: 'illegal' };
  }
  if (!next.ok) return { ok: false, reason: 'illegal' };
  return {
    ok: true,
    result: resultOf(next.state.status, game.xSeat),
    move: next.state.moves.at(-1),
  };
}

/**
 * Whether a move made on an older revision was made while both players could move (Ship Sink's
 * placements): such moves do not depend on each other, so the rival's landing first does not make
 * it stale. A move made on any other position is stale as ever.
 */
function madeAtOnce(setup: GameRoomSetup, moves: readonly unknown[], revision: number): boolean {
  const { rules } = gameById(setup.gameId);
  if (!rules.mayMove || revision < 0 || revision > moves.length) return false;
  const then = rules.replay(moves.slice(0, revision), setup.rulesVersion, setup.variant).state;
  return !!then && rules.mayMove(then, 'X') && rules.mayMove(then, 'O');
}

type Rules = ReturnType<typeof gameById>['rules'];
type Position = NonNullable<ReturnType<Rules['replay']>['state']>;

/**
 * Whether `symbol` may make `move` now: theirs to make (the player to move, or whoever the game
 * says may move), and not made in the other player's name; otherwise why not.
 */
function mayPlay(
  rules: Rules,
  position: Position,
  symbol: Player,
  move: unknown,
): true | 'not-your-turn' | 'illegal' {
  const may = rules.mayMove
    ? rules.mayMove(position, symbol)
    : position.status.kind === 'in-progress' && position.turn === symbol;
  if (!may) return 'not-your-turn';
  try {
    // A move in the other player's name (a placement naming them) is not this seat's to make.
    return rules.moverOf && rules.moverOf(position, move) !== symbol ? 'not-your-turn' : true;
  } catch {
    return 'illegal';
  }
}

/** A game's end by seat: a draw, or the seat that played the winning symbol. */
function resultOf(status: Position['status'], xSeat: Seat): GameRoomResult | null {
  if (status.kind === 'in-progress') return null;
  if (status.kind === 'drawn') return 'draw';
  return status.winner === 'X' ? `won-${xSeat}` : `won-${otherSeat(xSeat)}`;
}

/** The next game after `finished` asked for a rematch, symbols swapped; null when not the time. */
export function nextGame(current: GameRow, finished: number): { game: number; xSeat: Seat } | null {
  return current.game === finished && current.result
    ? { game: current.game + 1, xSeat: otherSeat(current.xSeat) }
    : null;
}

/**
 * The moves a player may see: all of them, or in a game of hidden information only that player's
 * view of them (`redact`: nothing that locates a rival ship still afloat).
 */
function seenBy(
  setup: GameRoomSetup,
  moves: readonly unknown[],
  player: Player,
): readonly unknown[] {
  const { rules } = gameById(setup.gameId);
  if (!rules.hidden) return moves;
  const whole = rules.replay(moves, setup.rulesVersion, setup.variant).state;
  if (!whole) {
    // Never the whole game instead (it would show the rival fleet), and never a throw that would
    // stop every broadcast: the seat gets no moves, and the room says why in its log.
    console.error('The room holds moves its engine cannot replay', setup);
    return [];
  }
  return rules.hidden.redact(whole, player);
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
    moves: seenBy(room.setup, room.moves, symbolOf(you, room.game.xSeat)),
    revision: room.moves.length,
    result: room.game.result,
    score: room.score,
    seats: [seat(0), seat(1)],
    you,
  };
}
