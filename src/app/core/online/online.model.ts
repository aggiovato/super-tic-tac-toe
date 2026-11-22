import type { GameId } from '@catalog';
import type { Seat } from '@protocol';

/** The room's socket: opening, open, lost and trying again, or closed for good. */
export type ConnectionState = 'connecting' | 'open' | 'reconnecting' | 'closed';

/** Why this device cannot play in a room: no such room, both seats taken, or the server is out of reach. */
export type RoomProblem = 'missing' | 'full' | 'expired' | 'unreachable';

/** A seat this device holds in a room: its token is the only proof, kept on this device. */
export interface RoomCredentials {
  readonly gameId: GameId;
  readonly seat: Seat;
  readonly token: string;
  readonly savedAt: number;
  /**
   * This device left the room (navigated away inside the app): coming back, by the browser's back
   * button or the link, asks before taking the seat again instead of reconnecting silently.
   */
  readonly left?: boolean;
}

/** What the room says of the other player. */
export interface RivalPresence {
  /** Someone took the other seat. */
  readonly joined: boolean;
  /** Their socket is open now. */
  readonly online: boolean;
}
