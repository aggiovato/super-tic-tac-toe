/** Version of the executable rules. Saved games record it so they can be replayed later. */
export const RULES_VERSION = 1;
export type RulesVersion = typeof RULES_VERSION;

export type Player = 'X' | 'O';

/** Content of a single cell: a player's piece or empty. */
export type Mark = Player | null;

/** Three indices (0–8, row by row from the top-left) forming a row, column or diagonal. */
export type Line = readonly [number, number, number];

/** A move places the current player's piece on `cell` of mini board `board`, both 0–8. */
export interface Move {
  readonly board: number;
  readonly cell: number;
}

export type BoardStatus =
  | { readonly kind: 'open' }
  | { readonly kind: 'won'; readonly winner: Player; readonly line: Line }
  | { readonly kind: 'drawn' };

export type GameStatus =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'won'; readonly winner: Player; readonly line: Line }
  | { readonly kind: 'drawn' };

/** Where the next move may be played. */
export type Target =
  | { readonly kind: 'free' }
  | { readonly kind: 'forced'; readonly board: number }
  | { readonly kind: 'game-over' };

export interface GameState {
  readonly rulesVersion: RulesVersion;
  /** `cells[board][cell]`, nine mini boards of nine cells. */
  readonly cells: readonly (readonly Mark[])[];
  readonly boards: readonly BoardStatus[];
  /** Player who moves next. After the game ends it is the player who would have moved. */
  readonly turn: Player;
  readonly target: Target;
  readonly status: GameStatus;
  /** Accepted moves in order. Replaying them rebuilds this exact state. */
  readonly moves: readonly Move[];
  /** Number of accepted moves; used to detect stale commands and replies. */
  readonly revision: number;
}

export type RejectionReason =
  'game-over' | 'invalid-coordinates' | 'board-closed' | 'wrong-board' | 'cell-occupied';

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
