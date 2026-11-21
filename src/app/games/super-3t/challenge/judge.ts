import { replay, type GameState } from '@super3t/core';
import { defend, refutations } from '@super3t/ai';
import type { Challenge, ChallengeProgress } from './challenge.model';

/** The challenge's prepared position. Throws if its moves are not a legal game (a data error). */
export function challengeStart(challenge: Challenge): GameState {
  const result = replay(challenge.moves, challenge.rulesVersion);
  if (!result.ok) {
    throw new Error(`Challenge ${challenge.id} does not replay: ${result.reason}`);
  }
  return result.state;
}

/**
 * Judges an attempt: `state` is the prepared position `start` plus the moves played since. The key
 * move leaves the defender only replies that lose at once; the closing move then wins the game.
 */
export function judge(start: GameState, state: GameState): ChallengeProgress {
  const played = state.moves.length - start.moves.length;
  const status = state.status;
  if (status.kind === 'won' && status.winner === start.turn) {
    return { kind: 'solved' };
  }
  if (status.kind !== 'in-progress') {
    return { kind: 'missed' };
  }
  if (played <= 0) {
    return { kind: 'find-key' };
  }
  if (played === 1) {
    const reply = refutations(state)[0];
    return reply ? { kind: 'saved', reply: defend(state) ?? reply } : { kind: 'defending' };
  }
  return played === 2 ? { kind: 'finish' } : { kind: 'missed' };
}
