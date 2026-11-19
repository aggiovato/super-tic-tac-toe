import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves, type GameState, type Move } from '@core';
import { GLOBAL_DRAW, parseMoves, play } from '@core/testing';
import type { Level } from './models';
import { chooseMove } from './opponent';
import { createRandom, pickWeighted, turnSeed } from './random';
import { outcomes, winningMoves } from './tactics';
import {
  CAN_HAND_THE_GAME,
  FORCED_WIN_IN_THREE,
  LONG_GAME,
  MUST_BLOCK_THE_GAME,
  opening,
} from './testing';
import { cellWeight } from './weights';

/** A clock that allows `nodes` readings, then is out of time: a deterministic node limit. */
const nodeLimit = (nodes: number) => {
  let readings = 0;
  return () => (readings++ < nodes ? 0 : Number.MAX_SAFE_INTEGER);
};
const advanced = (state: GameState, seed: number, nodes = 3000) =>
  chooseMove(state, { level: 'advanced', seed, now: nodeLimit(nodes) });
const notation = (move: Move | null) => (move ? `${move.board}.${move.cell}` : null);
const SEEDS = Array.from({ length: 10 }, (_, index) => index + 1);

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

/** Whether `move` wins by force: it wins at once, or every reply leaves a game win in one. */
const forcesWin = (state: GameState, move: Move): boolean => {
  const result = applyMove(state, move);
  if (!result.ok) {
    return false;
  }
  if (result.state.status.kind === 'won') {
    return true;
  }
  const replies = outcomes(result.state);
  return (
    replies.length > 0 &&
    replies.every((reply) => !reply.winsGame && winningMoves(reply.next).game.length > 0)
  );
};

const transform = (moves: string, map: readonly number[]): string =>
  parseMoves(moves)
    .map(({ board, cell }) => `${map[board]}.${map[cell]}`)
    .join(' ');

describe('advanced opponent', () => {
  it('wins the game when one move does it', () => {
    const state = play(LONG_GAME);
    for (const seed of SEEDS) {
      expect(notation(advanced(state, seed))).toBe('4.2');
    }
  });

  it('never hands the opponent the game while a safe move is left', () => {
    const state = play(CAN_HAND_THE_GAME);
    for (const seed of SEEDS) {
      expect(['7.0', '7.1', '7.4']).not.toContain(notation(advanced(state, seed)));
    }
  });

  it('never lets the opponent win the game next, in every symmetry of the position', () => {
    // 4.5 would hand the game over; 4.4 blocks and 4.2 is safe too (it sends the opponent away).
    for (const map of SYMMETRIES) {
      const state = play(transform(MUST_BLOCK_THE_GAME, map));
      for (const seed of SEEDS.slice(0, 3)) {
        expect(notation(advanced(state, seed))).not.toBe(`${map[4]}.${map[5]}`);
      }
    }
  });

  it('finds a win two of its moves away that the intermediate does not see', () => {
    const state = play(FORCED_WIN_IN_THREE);
    // The engine confirms the fixture: 8.8 is the only move that wins by force.
    expect(
      legalMoves(state)
        .filter((move) => forcesWin(state, move))
        .map(notation),
    ).toEqual(['8.8']);
    for (const map of SYMMETRIES) {
      const turned = play(transform(FORCED_WIN_IN_THREE, map));
      expect(notation(advanced(turned, 1))).toBe(`${map[8]}.${map[8]}`);
    }
    for (const seed of SEEDS) {
      expect(notation(advanced(state, seed))).toBe('8.8');
    }
    const intermediate = chooseMove(state, { level: 'intermediate', seed: 1, now: () => 0 });
    expect(notation(intermediate)).not.toBe('8.8');
  });

  it('stops deepening once a round has followed every line to the end of the game', () => {
    // Three moves from the end of a drawn game the search is deterministic: 10,573 clock readings
    // when it stops after the first round that reaches no horizon, 15,375 when it deepens on
    // until the playable cells run out (and far more when closed boards' cells still counted).
    const total = parseMoves(GLOBAL_DRAW).length;
    const state = play(opening(GLOBAL_DRAW, total - 3));
    let readings = 0;
    chooseMove(state, { level: 'advanced', seed: 1, now: () => (readings++, 0) });
    expect(readings).toBeLessThan(12_000);
  });

  it('plays its prepared fallback when no round of the search completes', () => {
    const state = initialState();
    for (const seed of SEEDS) {
      const fallback = pickWeighted(
        legalMoves(state),
        cellWeight,
        createRandom(turnSeed(seed, state.revision)),
      );
      expect(advanced(state, seed, 1)).toEqual(fallback);
    }
  });

  it('keeps the last complete round when time runs out in the middle of the next one', () => {
    const state = play(CAN_HAND_THE_GAME);
    // One reading for the deadline, one per root move: the first round completes, the second
    // never starts its first move. A few more readings cut the second round short instead.
    const firstRound = 1 + legalMoves(state).length;
    for (const seed of SEEDS) {
      const roundOne = advanced(state, seed, firstRound);
      expect(advanced(state, seed, firstRound + 3)).toEqual(roundOne);
    }
  });

  it('answers legally and never misses a win in one along generated games', () => {
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
        const move = advanced(state, seed, 400);
        if (state.status.kind !== 'in-progress') {
          expect(move).toBeNull();
          return;
        }
        const chosen = outcomes(state).find((outcome) => notation(outcome.move) === notation(move));
        expect(chosen).toBeDefined();
        if (winningMoves(state).game.length > 0) {
          expect(chosen?.winsGame).toBe(true);
        }
      }),
      { numRuns: 60 },
    );
  });

  it('beats the intermediate over a reproducible batch, playing either side', () => {
    const tally = { advanced: 0, intermediate: 0, draw: 0 };
    for (let game = 0; game < 10; game++) {
      const levels: Record<'X' | 'O', 'advanced' | 'intermediate'> =
        game % 2 === 0
          ? { X: 'advanced', O: 'intermediate' }
          : { X: 'intermediate', O: 'advanced' };
      let state = initialState();
      while (state.status.kind === 'in-progress') {
        const level: Level = levels[state.turn];
        const move = chooseMove(state, {
          level,
          seed: game * 1000 + 3,
          now: level === 'advanced' ? nodeLimit(2000) : () => 0,
        });
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
    expect(tally.advanced).toBeGreaterThanOrEqual(7);
    expect(tally.intermediate).toBeLessThanOrEqual(1);
  }, 30_000);
});
