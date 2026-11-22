import type { GameId } from '@catalog';
import type { GameRoomResult, GameRoomScore, JoinRefusal, Seat } from '@protocol';

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
