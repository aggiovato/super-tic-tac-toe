import type { GameId } from '@catalog';
import type { ChatRefusal, Seat } from '@protocol';

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
  /** The last chat message this device has seen (its `id`): what came after it is unread. */
  readonly readChat?: number;
}

/**
 * A line of the room's chat as this device shows it: a message the room keeps, or one of this
 * player's on its way (`sending`) or not kept (`refused`, and why).
 */
export interface ChatEntry {
  /** Stable across the message arriving: its client id when this player wrote it. */
  readonly key: string;
  readonly mine: boolean;
  readonly text: string;
  /** When it was said (ms): the room's time once kept, this device's while on its way. */
  readonly at: number;
  readonly state: 'sent' | 'sending' | 'refused';
  readonly reason?: ChatRefusal;
}

/** What the room says of the other player. */
export interface RivalPresence {
  /** Someone took the other seat. */
  readonly joined: boolean;
  /** Their socket is open now. */
  readonly online: boolean;
}
