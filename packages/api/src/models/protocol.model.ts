import type { GameId } from '@catalog';
import type { GameRoomResult, GameRoomScore, Seat } from './game-room.model';

/** A seat's presence, as both players see it. */
export interface SeatView {
  /** Someone holds this seat (the creator always does; the guest once they joined). */
  readonly taken: boolean;
  /** Its player has a socket open now. */
  readonly online: boolean;
}

/** The whole room as the server holds it: what every player receives after each change. */
export interface GameRoomState {
  readonly type: 'state';
  readonly gameId: GameId;
  readonly variant: string;
  readonly rulesVersion: number;
  /** The current game of the room's series, from 1; a rematch starts the next one. */
  readonly game: number;
  /** The seat playing X in the current game; symbols swap on every rematch. */
  readonly xSeat: Seat;
  readonly moves: readonly unknown[];
  /** Moves accepted so far in the current game: what the next move must expect. */
  readonly revision: number;
  readonly result: GameRoomResult | null;
  /** Wins by seat and draws over the room's finished games. */
  readonly score: GameRoomScore;
  readonly seats: readonly [SeatView, SeatView];
  /** The seat of the player this copy is sent to. */
  readonly you: Seat;
}

/** Why the server refused a move. */
export type MoveRefusal =
  | 'waiting' /* the guest has not joined yet */
  | 'game-over'
  | 'stale' /* another move came first: the state that came with it is current */
  | 'not-your-turn'
  | 'illegal';

/** A move, sent once per attempt; a retry of the same attempt keeps its `commandId`. */
export interface MoveMessage {
  readonly type: 'move';
  readonly commandId: string;
  /** The revision the move was made on; a move made on an older one is `stale`. */
  readonly expectedRevision: number;
  readonly move: unknown;
}

/** Asks for the next game once the current one is over; `game` is the one that ended. */
export interface RematchMessage {
  readonly type: 'rematch';
  readonly game: number;
}

/** Asks for the current state again (after a reconnection, the state is sent unasked). */
export interface SyncMessage {
  readonly type: 'sync';
}

export type ClientMessage = MoveMessage | RematchMessage | SyncMessage;

/** The server's answer to the sender of a move: accepted at a revision, or refused and why. */
export type MoveReply =
  | { readonly type: 'ack'; readonly commandId: string; readonly revision: number }
  | { readonly type: 'refused'; readonly commandId: string; readonly reason: MoveRefusal };

export type ServerMessage =
  GameRoomState | MoveReply | { readonly type: 'error'; readonly reason: string };
