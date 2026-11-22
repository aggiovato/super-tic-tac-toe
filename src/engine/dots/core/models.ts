import type { Player } from '@tictac';

/** Version of the Dots and Boxes rules. Saved games record it so they can be replayed later. */
export const RULES_VERSION = 1;
export type RulesVersion = typeof RULES_VERSION;

/** Boxes per side the first version offers; the variant of a game is its size as text. */
export const SIZES = [3, 5] as const;
export type Size = (typeof SIZES)[number];
export const DEFAULT_SIZE: Size = 3;

/**
 * A move draws one line between two neighbouring dots: `h` joins dot (row, col) to (row, col + 1),
 * `v` joins (row, col) to (row + 1, col). Dots are numbered from the top-left, 0 to size.
 */
export interface Move {
  readonly orientation: 'h' | 'v';
  readonly row: number;
  readonly col: number;
}

/** How a game stands: boxes are counted, so a win has no line. */
export type DotsStatus =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'won'; readonly winner: Player }
  | { readonly kind: 'drawn' };

export interface GameState {
  readonly rulesVersion: RulesVersion;
  /** Boxes per side. */
  readonly size: Size;
  /** Who drew each horizontal line, row by row: (size + 1) rows of size lines. */
  readonly h: readonly (Player | null)[];
  /** Who drew each vertical line, row by row: size rows of size + 1 lines. */
  readonly v: readonly (Player | null)[];
  /** Who closed each box, row by row: size rows of size boxes. */
  readonly boxes: readonly (Player | null)[];
  /** Player who moves next; a player who closes a box moves again. */
  readonly turn: Player;
  readonly status: DotsStatus;
  /** Boxes closed by each player. */
  readonly score: { readonly X: number; readonly O: number };
  /** Accepted moves in order. Replaying them with the size rebuilds this exact state. */
  readonly moves: readonly Move[];
  readonly revision: number;
}

export type RejectionReason = 'game-over' | 'invalid-coordinates' | 'line-taken';

/** A rejection returns the untouched input state, so position, revision and turn are kept. */
export type MoveResult =
  | { readonly ok: true; readonly state: GameState; readonly closed: number }
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
