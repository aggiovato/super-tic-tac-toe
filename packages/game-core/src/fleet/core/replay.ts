import { applyMove, initialState } from './engine';
import { type Move, RULES_VERSION, type ReplayResult } from './models';

/**
 * Rebuilds a game from its moves. Ship Sink has one shape, so the variant is ignored. The same
 * moves and rules version always yield the same state; replay stops at the first illegal move.
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
