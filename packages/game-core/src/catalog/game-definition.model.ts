import type { Player } from '@tictac';
import type { ComputerLevel } from './levels';

/** How a game stands: going on, won by a player, or drawn. */
export type PositionStatus =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'won'; readonly winner: Player }
  | { readonly kind: 'drawn' };

/** What every game's position has in common: whose turn, how it stands, and its moves. */
export interface Position<M> {
  readonly rulesVersion: number;
  readonly turn: Player;
  readonly status: PositionStatus;
  readonly moves: readonly M[];
}

/**
 * How a game played on this device is set up: two people sharing it, or a person against the
 * computer player. (Online play is a room's, never a saved choice. Stored as 'humans' and
 * 'opponent' before schema 2; `readSetup` in `@preferences` reads those too.)
 */
export type PlayMode = 'local' | 'computer';

/**
 * A game of hidden information (Ship Sink: where the fleets lie): each player sees a part of it.
 * The server sends each seat only the moves `redact` lets it see, and that player's device rebuilds
 * its view of the game from them with `replayView`; a move of theirs still on its way joins the view
 * at once (a shot is pending until its outcome comes).
 */
export interface HiddenInformation<S, M> {
  /** The moves of a whole game that `player` may see. */
  redact(state: S, player: Player): readonly M[];
  /** `viewer`'s view of the game, rebuilt from the moves they were sent and their own on the way. */
  replayView(
    moves: readonly M[],
    rulesVersion: number,
    variant: string,
    viewer: Player,
  ): { readonly ok: boolean; readonly state?: S };
}

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
  /**
   * Whether `player` may move now. Without it, the player to move (`turn`) while the game goes
   * on; a game where both may move at once (Ship Sink's placements) says so here.
   */
  mayMove?(state: S, player: Player): boolean;
  /** Present for a game of hidden information; such a game has no undo (it would peek). */
  hidden?: HiddenInformation<S, M>;
}

/**
 * One game of the family, as plain data and its engine: what every part of the app (and later the
 * server) needs to know about a game without knowing the game. Each game's UI adds its own part
 * (routes, preview) in the app layer.
 */
export interface GameDefinition<
  Id extends string = string,
  M = unknown,
  S extends Position<M> = Position<M>,
> {
  readonly id: Id;
  /** The rules a new game is played with; saved games carry their own. */
  readonly rulesVersion: number;
  /** The shapes the game is played in, the default first; `['']` for a game with one shape. */
  readonly variants: readonly string[];
  /** The variant a stored or chosen value stands for: empty and unknown values read as the default. */
  variantOf(raw: string | undefined): string;
  /**
   * How the game may be played on one device, the default first. A game of hidden information
   * leaves out `local`: two people sharing a screen would see each other's secrets.
   */
  readonly modes: readonly PlayMode[];
  /** Whether a game can end in a draw: the series score counts draws only where it can. */
  readonly draws: boolean;
  /** Whether the game may be played online, in a room by invitation. */
  readonly online: boolean;
  /** The computer player's levels, weakest first. */
  readonly levels: readonly ComputerLevel[];
  /** The main game: first in the library, as a banner. */
  readonly featured: boolean;
  readonly rules: GameRules<S, M>;
}
