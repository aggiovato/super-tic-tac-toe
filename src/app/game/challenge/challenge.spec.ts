import { applyMove, legalMoves, replay, type GameState, type Move } from '@core';
import { keyMoves } from '@ai';
import { describe, expect, it } from 'vitest';
import { CHALLENGES, findChallenge } from './challenges';
import { challengeStart, judge } from './judge';

const after = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(`${move.board}.${move.cell} rejected: ${result.reason}`);
  }
  return result.state;
};

/** The eight rotations and reflections of a 3×3 grid, as maps of an index 0–8. */
const SYMMETRIES: readonly ((index: number) => number)[] = [
  (i) => i,
  (i) => (i % 3) * 3 + (2 - Math.floor(i / 3)),
  (i) => 8 - i,
  (i) => (2 - (i % 3)) * 3 + Math.floor(i / 3),
  (i) => Math.floor(i / 3) * 3 + (2 - (i % 3)),
  (i) => (2 - Math.floor(i / 3)) * 3 + (i % 3),
  (i) => (i % 3) * 3 + Math.floor(i / 3),
  (i) => (2 - (i % 3)) * 3 + (2 - Math.floor(i / 3)),
];

const turned = (move: Move, map: (index: number) => number): Move => ({
  board: map(move.board),
  cell: map(move.cell),
});

describe.each(CHALLENGES)('challenge $id ($level)', (challenge) => {
  const start = challengeStart(challenge);
  const [key] = keyMoves(start);

  it('is a game in progress with X to move and no win in one', () => {
    expect(start.status.kind).toBe('in-progress');
    expect(start.turn).toBe('X');
    const wins = keyMoves(start).map((move) => after(start, move).status.kind);
    expect(wins).not.toContain('won');
  });

  it('has exactly one key move, in each of its eight rotations and reflections', () => {
    expect(key).toBeDefined();
    for (const map of SYMMETRIES) {
      const moves = challenge.moves.map((move) => turned(move, map));
      const result = replay(moves, challenge.rulesVersion);
      expect(result.ok).toBe(true);
      if (result.ok && key) {
        expect(keyMoves(result.state)).toEqual([turned(key, map)]);
      }
    }
  });

  it('is solved by the key move, then a winning move after any reply', () => {
    if (!key) {
      throw new Error('no key move');
    }
    expect(judge(start, start)).toEqual({ kind: 'find-key' });
    const keyed = after(start, key);
    expect(judge(start, keyed)).toEqual({ kind: 'defending' });
    for (const reply of legalMoves(keyed)) {
      const replied = after(keyed, reply);
      expect(judge(start, replied)).toEqual({ kind: 'finish' });
      const finishes = legalMoves(replied).map((move) => after(replied, move));
      const won = finishes.find((state) => state.status.kind === 'won');
      const other = finishes.find((state) => state.status.kind === 'in-progress');
      expect(won && judge(start, won)).toEqual({ kind: 'solved' });
      if (other) {
        expect(judge(start, other)).toEqual({ kind: 'missed' });
      }
    }
  });

  it('names the reply that holds out against any other move', () => {
    for (const move of legalMoves(start).filter(
      (m) => m.board !== key?.board || m.cell !== key.cell,
    )) {
      const progress = judge(start, after(start, move));
      expect(progress.kind).toBe('saved');
      if (progress.kind === 'saved') {
        // The named reply really saves the defender: no win in one for the player afterwards.
        const saved = after(after(start, move), progress.reply);
        const wins = legalMoves(saved).filter((m) => after(saved, m).status.kind === 'won');
        expect(saved.status.kind !== 'in-progress' || wins.length === 0).toBe(true);
      }
    }
  });
});

describe('judge', () => {
  it('counts a finished game the player did not win as missed', () => {
    const challenge = CHALLENGES[0];
    if (!challenge) {
      throw new Error('no challenges');
    }
    const start = challengeStart(challenge);
    const drawn: GameState = { ...start, status: { kind: 'drawn' } };
    expect(judge(start, drawn)).toEqual({ kind: 'missed' });
  });

  it('refuses a challenge whose moves do not replay', () => {
    expect(() =>
      challengeStart({
        id: 'broken',
        level: 'easy',
        rulesVersion: 1,
        moves: [{ board: 9, cell: 0 }],
      }),
    ).toThrow(/does not replay/);
  });

  it('finds challenges by id', () => {
    expect(findChallenge('row-2026-11')?.level).toBe('hard');
    expect(findChallenge('nope')).toBeUndefined();
  });
});
