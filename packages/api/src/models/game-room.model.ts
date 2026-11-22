import type { GameId } from '@catalog';

/** Side 0 or 1 of a room; side 0 created it, side 1 joined through the invitation. */
export type Seat = 0 | 1;

/** How a finished game of the room ended, by seat. */
export type GameRoomResult = 'won-0' | 'won-1' | 'draw';

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

/** Wins by seat and draws over a room's finished games. */
export interface GameRoomScore {
  readonly wins: readonly [number, number];
  readonly draws: number;
}

/** What joining a room gives back: the guest's seat and token, or why it cannot be taken. */
export type JoinOutcome =
  | { readonly ok: true; readonly seat: Seat; readonly token: string }
  | { readonly ok: false; readonly reason: 'missing' | 'full' };
