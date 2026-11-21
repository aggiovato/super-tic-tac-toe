import type { GameStatus, Mark, Player } from '@tictac';

/** Version of the classic rules. Saved games record it so they can be replayed later. */
export const RULES_VERSION = 1;
export type RulesVersion = typeof RULES_VERSION;

/** A move places the current player's piece on `cell`, 0–8 row by row from the top-left. */
export interface Move {
  readonly cell: number;
}

export interface GameState {
  readonly rulesVersion: RulesVersion;
  /** The nine cells, row by row. */
  readonly cells: readonly Mark[];
  /** Player who moves next. After the game ends it is the player who would have moved. */
  readonly turn: Player;
  readonly status: GameStatus;
  /** Accepted moves in order. Replaying them rebuilds this exact state. */
  readonly moves: readonly Move[];
  /** Number of accepted moves; used to detect stale commands and replies. */
  readonly revision: number;
}

export type RejectionReason = 'game-over' | 'invalid-coordinates' | 'cell-occupied';

/** A rejection returns the untouched input state, so position, revision and turn are kept. */
export type MoveResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: RejectionReason; readonly state: GameState };

export type ReplayResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: 'unsupported-rules-version' }
  | {
      readonly ok: false;
      readonly reason: RejectionReason;
      /** Index of the first rejected move. */
      readonly index: number;
      /** State after the last accepted move. */
      readonly state: GameState;
    };
