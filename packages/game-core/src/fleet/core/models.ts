import type { Player } from '@tictac';

/** Version of the Ship Sink rules. Saved games record it so they can be replayed later. */
export const RULES_VERSION = 1;
export type RulesVersion = typeof RULES_VERSION;

/** Cells per side of a board: rows A–J (0–9), columns 1–10 (0–9). */
export const BOARD_SIZE = 10;

/** The ships of a fleet, largest first. */
export const SHIP_IDS = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'] as const;
export type ShipId = (typeof SHIP_IDS)[number];

/** Cells each ship covers: the fleet is 5 · 4 · 3 · 3 · 2, 17 cells. */
export const SHIP_LENGTHS: Readonly<Record<ShipId, number>> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

/** One cell of a board, from the top-left. */
export interface Cell {
  readonly row: number;
  readonly col: number;
}

/** A ship on its board: its bow (top or left cell) and which way it runs from there. */
export interface ShipPlacement extends Cell {
  readonly ship: ShipId;
  readonly orientation: 'h' | 'v';
}

/** A whole fleet: each ship of `SHIP_IDS` once. */
export type Fleet = readonly ShipPlacement[];

/**
 * A move: a player places their whole fleet (once, before any shot; both may place in any order,
 * so the move names its player), or the player to move fires at a cell of the rival's waters.
 */
export type Move =
  | { readonly kind: 'place'; readonly player: Player; readonly fleet: Fleet }
  | { readonly kind: 'shot'; readonly row: number; readonly col: number };

/** What a shot did: nothing, a hit, or the last cell of a ship. */
export type Outcome = 'water' | 'hit' | 'sunk';

/** A shot fired and what it did; a sinking shot names the ship it sank and where it lay. */
export interface Shot extends Cell {
  readonly outcome: Outcome;
  readonly sunk?: ShipPlacement;
}

/** Placing the fleets, firing, or over. */
export type Phase = 'placing' | 'firing' | 'over';

/** How a game stands: someone sinks the whole rival fleet; there are no draws. */
export type FleetStatus =
  { readonly kind: 'in-progress' } | { readonly kind: 'won'; readonly winner: Player };

/** Each player's own value. */
export interface PerPlayer<T> {
  readonly X: T;
  readonly O: T;
}

export interface GameState {
  readonly rulesVersion: RulesVersion;
  readonly phase: Phase;
  /** Each player's fleet, null until placed. */
  readonly fleets: PerPlayer<Fleet | null>;
  /** The shots each player fired at the rival's waters, in order. */
  readonly shots: PerPlayer<readonly Shot[]>;
  /** The player who fires next (X fires first); a hit or a sinking shot fires again. */
  readonly turn: Player;
  readonly status: FleetStatus;
  /** Accepted moves in order. Replaying them rebuilds this exact state. */
  readonly moves: readonly Move[];
  readonly revision: number;
}

/** Why a fleet cannot be placed. */
export type FleetProblem = 'composition' | 'out-of-bounds' | 'overlap' | 'touching';

export type RejectionReason =
  | 'game-over'
  /* a placement once the firing started, or a second one for the same player */
  | 'already-placed'
  | 'invalid-fleet'
  /* a shot while a fleet is still to be placed */
  | 'placing'
  | 'invalid-coordinates'
  | 'already-shot';

/** A rejection returns the untouched input state, so position, revision and turn are kept. */
export type MoveResult =
  | { readonly ok: true; readonly state: GameState; readonly shot?: Shot }
  | { readonly ok: false; readonly reason: RejectionReason; readonly state: GameState };

export type ReplayResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: 'unsupported-rules-version' }
  | {
      readonly ok: false;
      readonly reason: RejectionReason;
      readonly index: number;
      readonly state: GameState;
    };
