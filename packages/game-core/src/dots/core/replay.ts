import { applyMove, initialState } from './engine';
import { RULES_VERSION, type Move, type ReplayResult } from './models';
import { sizeOfVariant } from './variant';

/**
 * Rebuilds a game of `variant` (its size, '3' or '5'; empty or unknown is the default) from its moves. The
 * same moves, rules version and size always yield the same state; replay stops at the first
 * illegal move.
 */
export function replay(
  moves: readonly Move[],
  rulesVersion: number,
  variant: string,
): ReplayResult {
  if (rulesVersion !== RULES_VERSION) {
    return { ok: false, reason: 'unsupported-rules-version' };
  }
  // An empty or unknown variant is the default board, as when the game starts.
  let state = initialState(sizeOfVariant(variant));
  for (const [index, move] of moves.entries()) {
    const result = applyMove(state, move);
    if (!result.ok) {
      return { ok: false, reason: result.reason, index, state };
    }
    state = result.state;
  }
  return { ok: true, state };
}
