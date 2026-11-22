import { applyMove, initialState } from './engine';
import { RULES_VERSION, type Move, type ReplayResult } from './models';

/**
 * Rebuilds a game from its moves. The same moves and rules version always yield the same state.
 * Stops at the first illegal move and reports its index with the last valid state.
 */
export function replay(moves: readonly Move[], rulesVersion: number): ReplayResult {
  if (rulesVersion !== RULES_VERSION) {
    return { ok: false, reason: 'unsupported-rules-version' };
  }
  let state = initialState();
  for (const [index, move] of moves.entries()) {
    const result = applyMove(state, move);
    if (!result.ok) {
      return { ok: false, reason: result.reason, index, state };
    }
    state = result.state;
  }
  return { ok: true, state };
}
