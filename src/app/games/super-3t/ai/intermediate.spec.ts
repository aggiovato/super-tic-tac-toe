import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves, type GameState, type Move } from '@super3t/core';
import { parseMoves, play } from '@super3t/core/testing';
import type { Level } from './models';
import { chooseMove } from './computer';
import { outcomes, winningMoves } from './tactics';
import { createRandom, pickWeighted, turnSeed } from '@tictac';
import { cellWeight } from '@tictac';
import {
  CAN_HAND_THE_GAME,
  IDLE_BLOCK,
  LONG_GAME,
  MUST_BLOCK_THE_GAME,
  SENDS_TO_A_WIN,
} from './testing';

// A frozen clock: behaviour never depends on how fast the machine is (budgets are counted apart).
const reply = (state: GameState, seed: number, level: Level = 'intermediate') =>
  chooseMove(state, { level, seed, now: () => 0 });
const notation = (move: Move | null) => (move ? `${move.board}.${move.cell}` : null);
const SEEDS = Array.from({ length: 40 }, (_, index) => index + 1);

/** The eight rotations and reflections of a 3×3 grid, as index maps. */
const SYMMETRIES: readonly (readonly number[])[] = (() => {
  const rotate = (i: number) => (i % 3) * 3 + (2 - Math.floor(i / 3));
  const mirror = (i: number) => Math.floor(i / 3) * 3 + (2 - (i % 3));
  const maps: number[][] = [];
  let map = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let turn = 0; turn < 4; turn++) {
    maps.push(map, map.map(mirror));
    map = map.map(rotate);
  }
  return maps;
})();

const transform = (moves: string, map: readonly number[]): string =>
  parseMoves(moves)
    .map(({ board, cell }) => `${map[board]}.${map[cell]}`)
    .join(' ');

/** Moves after which the opponent can win the game with its reply. */
const handsTheGame = (state: GameState): Set<string> =>
  new Set(
    outcomes(state)
      .filter((outcome) => winningMoves(outcome.next).game.length > 0)
      .map((outcome) => notation(outcome.move) ?? ''),
  );

describe('intermediate opponent', () => {
  it('wins the game when one move does it', () => {
    const state = play(LONG_GAME);
    for (const seed of SEEDS) {
      expect(notation(reply(state, seed))).toBe('4.2');
    }
  });

  it('never hands the opponent the game while a safe move is left, unlike the beginner', () => {
    const state = play(CAN_HAND_THE_GAME);
    const unsafe = handsTheGame(state);
    expect([...unsafe].sort()).toEqual(['7.0', '7.1', '7.4']);
    for (const seed of SEEDS) {
      expect(unsafe.has(notation(reply(state, seed)) ?? '')).toBe(false);
    }
    const beginnerBlunders = SEEDS.filter((seed) =>
      unsafe.has(notation(reply(state, seed, 'beginner')) ?? ''),
    );
    expect(beginnerBlunders.length).toBeGreaterThan(0);
  });

  it('blocks the board that would win the opponent the game, in every symmetry', () => {
    for (const map of SYMMETRIES) {
      const state = play(transform(MUST_BLOCK_THE_GAME, map));
      for (const seed of SEEDS) {
        expect(notation(reply(state, seed))).toBe(`${map[4]}.${map[4]}`);
      }
    }
  });

  it('gives no credit to a block when the opponent has a second winning cell there', () => {
    const state = play(IDLE_BLOCK);
    const replies = new Set(SEEDS.map((seed) => notation(reply(state, seed))));
    // 4.4 blocks nothing and hands over a board; 4.6 blocks nothing either, so it is no favourite.
    expect(replies.has('4.4')).toBe(false);
    expect([...replies].some((move) => ['4.1', '4.2', '4.7'].includes(move ?? ''))).toBe(true);
  });

  it('plays its prepared fallback when its time is spent before it scores anything', () => {
    const state = initialState();
    let clock = 0;
    const late = () => (clock += 1000);
    for (const seed of SEEDS.slice(0, 10)) {
      const fallback = pickWeighted(
        legalMoves(state),
        cellWeight,
        createRandom(turnSeed(seed, state.revision)),
      );
      const move = chooseMove(state, { level: 'intermediate', seed, now: late });
      expect(move).toEqual(fallback);
    }
  });

  it('plays the best move scored so far when its time runs out midway', () => {
    const state = play(CAN_HAND_THE_GAME);
    // The first clock reading sets the deadline; the next three let it score three moves (in
    // legal-move order), then the time is gone.
    for (const seed of SEEDS.slice(0, 10)) {
      let readings = 0;
      const move = chooseMove(state, {
        level: 'intermediate',
        seed,
        now: () => (readings++ < 4 ? 0 : 10_000),
      });
      const scored = legalMoves(state).slice(0, 3).map(notation);
      expect(scored).toContain(notation(move));
    }
  });

  it('does not send the opponent to a board it can win when it has a choice', () => {
    const state = play(SENDS_TO_A_WIN);
    for (const seed of SEEDS) {
      expect(['2.0', '2.3', '2.8']).not.toContain(notation(reply(state, seed)));
    }
  });

  it('answers legally, wins when it can and stays safe along generated games', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 81 }), fc.integer(), (picks, seed) => {
        let state = initialState();
        for (const pick of picks) {
          const legal = legalMoves(state);
          const next = legal.length > 0 ? applyMove(state, legal[pick % legal.length]) : null;
          if (!next?.ok) {
            break;
          }
          state = next.state;
        }
        const move = reply(state, seed);
        if (state.status.kind !== 'in-progress') {
          expect(move).toBeNull();
          return;
        }
        const options = outcomes(state);
        const chosen = options.find((outcome) => notation(outcome.move) === notation(move));
        expect(chosen).toBeDefined();
        if (options.some((outcome) => outcome.winsGame)) {
          expect(chosen?.winsGame).toBe(true);
        } else if (handsTheGame(state).size < options.length) {
          expect(handsTheGame(state).has(notation(move) ?? '')).toBe(false);
        }
      }),
      { numRuns: 150 },
    );
  });

  it('beats the beginner over a reproducible batch, playing either side', () => {
    const tally = { intermediate: 0, beginner: 0, draw: 0 };
    for (let game = 0; game < 40; game++) {
      const levels: Record<'X' | 'O', 'intermediate' | 'beginner'> =
        game % 2 === 0
          ? { X: 'intermediate', O: 'beginner' }
          : { X: 'beginner', O: 'intermediate' };
      let state = initialState();
      while (state.status.kind === 'in-progress') {
        const move = reply(state, game * 1000 + 17, levels[state.turn]);
        const result = move ? applyMove(state, move) : null;
        if (!result?.ok) {
          throw new Error('An opponent answered with an illegal move');
        }
        state = result.state;
      }
      if (state.status.kind === 'won') {
        tally[levels[state.status.winner]] += 1;
      } else {
        tally.draw += 1;
      }
    }
    expect(tally.intermediate).toBeGreaterThanOrEqual(30);
    expect(tally.beginner).toBeLessThanOrEqual(3);
  });
});
