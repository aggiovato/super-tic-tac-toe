import type { GameState } from './game-state.model';
import type { RejectionReason } from './move-result.model';

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
