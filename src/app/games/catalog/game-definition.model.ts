import type { ComputerLevel } from './levels';

/** How a game's engine plays: what a match, the history and, later, the server ask of it. */
export interface GameRules<S, M> {
  legalMoves(state: S): readonly M[];
  replay(
    moves: readonly M[],
    rulesVersion: number,
    variant: string,
  ): { readonly ok: boolean; readonly state?: S };
  sameMove(a: M, b: M): boolean;
  /** One move on a position, for walking a game forward (undo steps, a server's check). */
  apply(state: S, move: M): { readonly ok: boolean; readonly state: S };
}

/**
 * One game of the family, as plain data and its engine: what every part of the app (and later the
 * server) needs to know about a game without knowing the game. Each game's UI adds its own part
 * (routes, preview) in the app layer.
 */
export interface GameDefinition<Id extends string = string, S = unknown, M = unknown> {
  readonly id: Id;
  /** The rules a new game is played with; saved games carry their own. */
  readonly rulesVersion: number;
  /** The shapes the game is played in, the default first; `['']` for a game with one shape. */
  readonly variants: readonly string[];
  /** The variant a stored or chosen value stands for: empty and unknown values read as the default. */
  variantOf(raw: string | undefined): string;
  /** The computer player's levels, weakest first. */
  readonly levels: readonly ComputerLevel[];
  /** The main game: first in the library, as a banner. */
  readonly featured: boolean;
  readonly rules: GameRules<S, M>;
}
