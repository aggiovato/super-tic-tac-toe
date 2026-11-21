import type { Move, RulesVersion } from '@super3t/core';

export type ChallengeLevel = 'easy' | 'medium' | 'hard';

/**
 * A prepared position where the player to move wins in two of their own moves against any
 * defence: one key move, then the move that closes the game.
 */
export interface Challenge {
  /** Stable identity: progress is recorded once per id. */
  readonly id: string;
  readonly level: ChallengeLevel;
  readonly rulesVersion: RulesVersion;
  /** The moves that lead to the position, from the opening. */
  readonly moves: readonly Move[];
}

/** Where an attempt stands, judged from the moves played since the prepared position. */
export type ChallengeProgress =
  /** The player looks for the key move. */
  | { readonly kind: 'find-key' }
  /** The key move is on the board; the defender is about to reply. */
  | { readonly kind: 'defending' }
  /** The defender replied; the player looks for the move that wins the game. */
  | { readonly kind: 'finish' }
  /** Not the key move: the defender would hold out with `reply`, so it does not play on. */
  | { readonly kind: 'saved'; readonly reply: Move }
  /** The key move was found but the closing move was not. */
  | { readonly kind: 'missed' }
  | { readonly kind: 'solved' };
