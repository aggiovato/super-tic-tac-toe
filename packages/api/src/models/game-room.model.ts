import type { GameId } from '@catalog';
import type { ChatMessage, GameRoomResult, GameRoomScore, JoinRefusal, Seat } from '@protocol';

export type { GameRoomResult, GameRoomScore, Seat };

/** A room's setup, fixed when it is created. */
export interface GameRoomSetup {
  readonly gameId: GameId;
  readonly variant: string;
  readonly rulesVersion: number;
}

/** The current game of a room's series. */
export interface GameRow {
  readonly game: number;
  readonly xSeat: Seat;
  readonly result: GameRoomResult | null;
}

/** An accepted move. */
export interface MoveRow {
  readonly revision: number;
  readonly commandId: string;
  readonly seat: Seat;
  readonly move: unknown;
}

/** What joining a room gives back: the guest's seat and token, or why it cannot be taken. */
export type JoinOutcome =
  | { readonly ok: true; readonly seat: Seat; readonly token: string }
  | { readonly ok: false; readonly reason: JoinRefusal };

/**
 * What saying something came to: the message kept (`fresh` when stored now, so everyone gets it),
 * refused past the chat budget, or null in a room that no longer exists.
 */
export type SayOutcome =
  | { readonly message: ChatMessage; readonly fresh: boolean }
  | { readonly refused: 'too-fast' }
  | null;

/** A chat message before the room stores it (the room gives it its order and time). */
export interface NewChatMessage {
  readonly clientId: string;
  readonly seat: Seat;
  readonly text: string;
}
