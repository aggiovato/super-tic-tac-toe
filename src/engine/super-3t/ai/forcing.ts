import type { GameState, Move, Player } from '@super3t/core';
import type { MoveOutcome } from './models';
import { outcomes } from './tactics';
import { cellWeight } from '@tictac';

/*
 * Tactical challenges: a prepared position where the player to move wins in two of their own moves
 * against any defence. The key move sends the opponent somewhere every reply concedes the game.
 */

/** Whether `state` is still in progress and its player to move can win the game in one move. */
function winsNow(state: GameState): boolean {
  return state.status.kind === 'in-progress' && outcomes(state).some((o) => o.winsGame);
}

/**
 * A reply that saves the defender: after it, the attacker cannot win at once. That is a reply that
 * wins or draws the game, or leaves a position with no winning move.
 */
function saves(reply: MoveOutcome): boolean {
  return !winsNow(reply.next);
}

/**
 * Replies of the player to move (the defender) that hold out: after any of them the attacker has no
 * move that wins the game at once.
 */
export function refutations(state: GameState): Move[] {
  return outcomes(state)
    .filter(saves)
    .map((reply) => reply.move);
}

/**
 * The key moves of a challenge: moves of the player to move that do not end the game themselves,
 * yet leave the opponent only replies after which the player wins at once.
 */
export function keyMoves(state: GameState): Move[] {
  return outcomes(state)
    .filter((o) => o.next.status.kind === 'in-progress' && !outcomes(o.next).some(saves))
    .map((o) => o.move);
}

/** Best first: a reply that wins the defender the game, then one that saves it, then the rest. */
function defenceRank(reply: MoveOutcome, defender: Player): number {
  const status = reply.next.status;
  if (status.kind === 'won' && status.winner === defender) {
    return 2;
  }
  return saves(reply) ? 1 : 0;
}

/**
 * The defender's reply in a challenge: a game win when it has one, else a reply that holds out,
 * else (every reply loses) any. Deterministic: ties go to the preferred cell, then the first move.
 * Returns null when the defender has no legal move.
 */
export function defend(state: GameState): Move | null {
  const defender = state.turn;
  let best: { readonly move: Move; readonly rank: number; readonly weight: number } | null = null;
  for (const reply of outcomes(state)) {
    const rank = defenceRank(reply, defender);
    const weight = cellWeight(reply.move);
    if (!best || rank > best.rank || (rank === best.rank && weight > best.weight)) {
      best = { move: reply.move, rank, weight };
    }
  }
  return best?.move ?? null;
}
