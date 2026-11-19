import type { BoardStatus } from './board-status.model';
import type { GameStatus } from './game-status.model';
import type { Move } from './move.model';
import type { Mark, Player } from './player.model';
import type { Target } from './target.model';

/** Version of the executable rules. Saved games record it so they can be replayed later. */
export const RULES_VERSION = 1;
export type RulesVersion = typeof RULES_VERSION;

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
