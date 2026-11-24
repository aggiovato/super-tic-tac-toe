import type { GameId } from '@catalog';

/**
 * The online protocol between the app and the API Worker (`packages/api`): plain types shared by
 * both ends, so they cannot drift apart. HTTP creates and joins a room; a WebSocket carries moves.
 */

/** Where the rooms live, under the app's own origin (the API is reached through `/api`). */
export const GAME_ROOMS_PATH = '/api/game-rooms';

/**
 * The socket's heartbeat: the client sends this text every `HEARTBEAT_MS` and the room answers
 * `HEARTBEAT_REPLY` without waking up. A client that hears nothing for `SILENCE_MS` reconnects; a
 * socket the room has not heard from for as long counts as gone (a lost network sends no close).
 */
export const HEARTBEAT = 'ping';
export const HEARTBEAT_REPLY = 'pong';
export const HEARTBEAT_MS = 20_000;
export const SILENCE_MS = 50_000;

/** Side 0 or 1 of a room; side 0 created it, side 1 joined through the invitation. */
export type Seat = 0 | 1;

/** How a finished game of the room ended, by seat. */
export type GameRoomResult = 'won-0' | 'won-1' | 'draw';

/** Wins by seat and draws over a room's finished games. */
export interface GameRoomScore {
  readonly wins: readonly [number, number];
  readonly draws: number;
}

/** `POST /api/game-rooms`: a room for a game of the catalog, and the variant it is played in. */
export interface CreateGameRoomRequest {
  readonly gameId: GameId;
  readonly variant?: string;
}

/** A seat taken: the token names it on the socket; it is sent once and kept by its player. */
export interface SeatGrant {
  readonly seat: Seat;
  readonly token: string;
}

/** The creator's seat (0) and the room's id, which is the invitation. */
export interface CreatedGameRoom extends SeatGrant {
  readonly roomId: string;
}

/**
 * Why a room cannot be joined (`POST /api/game-rooms/:id/join`): 404 missing, 409 full. Creating
 * or joining too often from one address answers 429 `too-many`.
 */
export type JoinRefusal = 'missing' | 'full';

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

/** The longest chat message, in characters (Unicode code points). */
export const CHAT_MAX = 280;

/** Chat messages a room keeps (the oldest go first); a reconnection receives them all. */
export const CHAT_KEPT = 200;

/**
 * A chat message to the other player, sent once per attempt: a retry keeps its `clientId`, so the
 * room stores it once. The text is the player's own, shown as plain text.
 */
export interface SayMessage {
  readonly type: 'say';
  readonly clientId: string;
  readonly text: string;
}

export type ClientMessage = MoveMessage | RematchMessage | SyncMessage | SayMessage;

/** A chat message as the room keeps it: its order (`id`), who wrote it and when (ms). */
export interface ChatMessage {
  readonly id: number;
  readonly clientId: string;
  readonly seat: Seat;
  readonly text: string;
  readonly at: number;
}

/** Why the room did not keep a chat message: too many too fast, or nothing (or too much) to say. */
export type ChatRefusal = 'too-fast' | 'invalid';

/**
 * The room's chat: the whole kept conversation when a socket connects (`chat`), each new message to
 * every player as it is said (`said`, its writer's included: its `clientId` tells them it arrived),
 * and to its writer alone a message the room did not keep (`unsaid`, by its `clientId`).
 */
export type ChatServerMessage =
  | { readonly type: 'chat'; readonly messages: readonly ChatMessage[] }
  | { readonly type: 'said'; readonly message: ChatMessage }
  | { readonly type: 'unsaid'; readonly clientId: string; readonly reason: ChatRefusal };

/** The server's answer to the sender of a move: accepted at a revision, or refused and why. */
export type MoveReply =
  | { readonly type: 'ack'; readonly commandId: string; readonly revision: number }
  | { readonly type: 'refused'; readonly commandId: string; readonly reason: MoveRefusal };

export type ServerMessage =
  | GameRoomState
  | MoveReply
  | ChatServerMessage
  | { readonly type: 'error'; readonly reason: string };
