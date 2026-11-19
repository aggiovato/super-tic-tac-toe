import type { GameState } from './game-state.model';

export type RejectionReason =
  'game-over' | 'invalid-coordinates' | 'board-closed' | 'wrong-board' | 'cell-occupied';

/** A rejection returns the untouched input state, so position, revision and turn are kept. */
export type MoveResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: RejectionReason; readonly state: GameState };
