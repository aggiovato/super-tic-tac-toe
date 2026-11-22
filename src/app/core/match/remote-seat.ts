import type { Signal } from '@angular/core';
import type { Participant } from './match.model';

/**
 * An online game as the server and this player's own moves on their way make it: the server's
 * moves followed by the ones sent and not yet confirmed, so a move shows at once (optimistic) and
 * is taken back if the server refuses it.
 */
export interface RemoteGame {
  /** The game of the room's series, from 1; a rematch starts the next one. */
  readonly number: number;
  readonly rulesVersion: number;
  readonly variant: string;
  /** The participant (a seat of the room) playing X in this game. */
  readonly xPlayer: Participant;
  readonly moves: readonly unknown[];
  /** The series score as the server counts it: finished games only. */
  readonly wins: readonly [number, number];
  readonly draws: number;
  /** Whether the server already counted this game's result. */
  readonly scored: boolean;
  /** The participant playing on this device. */
  readonly you: Participant;
}

/**
 * The other player, somewhere else: the match mirrors `game` and sends this player's moves and
 * rematches through it. Provided only on an online route (`@online`); a match without it is local.
 */
export abstract class RemoteSeat {
  /** Null until the room's first state arrives. */
  abstract readonly game: Signal<RemoteGame | null>;
  /** Sends a move made on the current position; it joins `game` at once. */
  abstract play(move: unknown): void;
  /** Asks for the next game once the current one is over. */
  abstract rematch(): void;
}
