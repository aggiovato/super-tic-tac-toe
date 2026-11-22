import type { ComputerLevel } from '@catalog';

/** What the computer player is asked: the game so far, from which it rebuilds the position. */
export interface ComputerRequest<M> {
  /** Accepted moves in order; the computer player rebuilds the position from them. */
  readonly moves: readonly M[];
  readonly level: ComputerLevel;
  /** Integer seed kept for the whole game. */
  readonly seed: number;
  /** The game's variant (a board size), '' for games that have one shape. */
  readonly variant: string;
}

/** Main thread → Worker: one request, tagged so its reply can be matched. */
export interface ComputerRequestMessage<M> extends ComputerRequest<M> {
  readonly id: number;
}

/** Worker → main thread: the reply to request `id`, or why there is none. */
export type ComputerReplyMessage<M> =
  | { readonly id: number; readonly move: M | null }
  | { readonly id: number; readonly error: string };
