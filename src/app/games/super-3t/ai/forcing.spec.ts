import { applyMove, type GameState, type Move } from '@super3t/core';
import { play } from '@super3t/core/testing';
import { describe, expect, it } from 'vitest';
import { defend, keyMoves, refutations } from './forcing';
import { KEY_MOVE, LONG_GAME } from './testing';

const after = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(`${move.board}.${move.cell} rejected: ${result.reason}`);
  }
  return result.state;
};

describe('forcing tactics', () => {
  const start = play(KEY_MOVE);

  it('finds the one key move: every reply then loses at once', () => {
    expect(keyMoves(start)).toEqual([{ board: 2, cell: 8 }]);
    const next = after(start, { board: 2, cell: 8 });
    expect(refutations(next)).toEqual([]);
  });

  it('refutes any other move: the defender has a reply that holds out', () => {
    const next = after(start, { board: 2, cell: 0 });
    expect(refutations(next).length).toBeGreaterThan(0);
    const reply = defend(next);
    expect(reply).not.toBeNull();
    expect(refutations(next)).toContainEqual(reply);
  });

  it('defends with a game win when it has one', () => {
    // At the end of LONG_GAME the player to move wins the game with 4.2.
    expect(defend(play(LONG_GAME))).toEqual({ board: 4, cell: 2 });
  });

  it('still answers when every reply loses, and not at all after the game', () => {
    const lost = after(start, { board: 2, cell: 8 });
    expect(defend(lost)).not.toBeNull();
    const over = after(play(LONG_GAME), { board: 4, cell: 2 });
    expect(defend(over)).toBeNull();
    expect(keyMoves(over)).toEqual([]);
  });
});
