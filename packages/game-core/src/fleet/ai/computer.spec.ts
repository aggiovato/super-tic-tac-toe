import {
  applyMove,
  type Cell,
  cellIndex,
  type Fleet,
  fleetProblem,
  type FleetView,
  type GameState,
  initialState,
  randomFleet,
  resolveShot,
  type Shot,
  shipRim,
  viewOf,
} from '@fleet/core';
import { cell, FLEET_A, FLEET_B, play } from '@fleet/core/testing';
import { createRandom, type Player } from '@tictac';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { chooseMove, type Level, LEVELS } from './computer';

const FLEETS = { X: FLEET_A, O: FLEET_B };

/** A view of X firing at `target`, built from X's shots alone: what the shooter knows. */
function firingView(shots: readonly Shot[]): FleetView {
  return {
    ...viewOf(play(FLEETS), 'X'),
    shots: { X: shots, O: [] },
    revision: shots.length + 2,
  };
}

/** Fires `level` at `target` until every ship is sunk; returns how many shots it took. */
function shotsToSink(level: Level, target: Fleet, seed: number): number {
  const shots: Shot[] = [];
  while (shots.filter((shot) => shot.outcome === 'sunk').length < 5) {
    const move = chooseMove(firingView(shots), { level, seed });
    if (move?.kind !== 'shot') throw new Error('no shot while firing');
    if (shots.some((shot) => cellIndex(shot) === cellIndex(move))) {
      throw new Error(`fired twice at ${move.row},${move.col}`);
    }
    shots.push(resolveShot(target, shots, move));
  }
  return shots.length;
}

/** Plays a whole game between two levels; returns the winner. */
function game(x: Level, o: Level, seed: number): Player {
  let state: GameState = initialState();
  for (let moves = 0; state.status.kind === 'in-progress'; moves++) {
    if (moves > 400) throw new Error('the game does not end');
    const player: Player = state.phase === 'placing' ? (state.fleets.X ? 'O' : 'X') : state.turn;
    const move = chooseMove(viewOf(state, player), {
      level: player === 'X' ? x : o,
      seed: seed * 2 + (player === 'X' ? 0 : 1),
    });
    if (!move) throw new Error(`${player} has no move`);
    const result = applyMove(state, move);
    if (!result.ok) throw new Error(`${player} played an illegal move: ${result.reason}`);
    state = result.state;
  }
  if (state.status.kind !== 'won') throw new Error('unfinished');
  return state.status.winner;
}

const mean = (values: readonly number[]) => values.reduce((a, b) => a + b, 0) / values.length;

describe('the Ship Sink computer player', () => {
  it('places a legal fleet of its own, the same for the same seed', () => {
    const view = viewOf(initialState(), 'O');
    for (const level of LEVELS) {
      const move = chooseMove(view, { level, seed: 11 });
      expect(move?.kind === 'place' && move.player).toBe('O');
      expect(move?.kind === 'place' && fleetProblem(move.fleet)).toBeNull();
      expect(chooseMove(view, { level, seed: 11 })).toEqual(move);
    }
  });

  it('has nothing to do once placed, out of turn, or after the end', () => {
    const placed = applyMove(initialState(), { kind: 'place', player: 'O', fleet: FLEET_B });
    if (!placed.ok) throw new Error(placed.reason);
    expect(chooseMove(viewOf(placed.state, 'O'), { level: 'advanced', seed: 1 })).toBeNull();
    expect(chooseMove(viewOf(play(FLEETS), 'O'), { level: 'advanced', seed: 1 })).toBeNull();
    const over = play(FLEETS, 'J1 J2 J3 J4 J5 A10 B10 C10 D10 E4 E5 E6 A6 B6 C6 G8 H8');
    expect(chooseMove(viewOf(over, 'X'), { level: 'advanced', seed: 1 })).toBeNull();
  });

  it('refuses an unknown level', () => {
    expect(() =>
      chooseMove(viewOf(play(FLEETS), 'X'), { level: 'expert' as Level, seed: 1 }),
    ).toThrow(/Unknown level/);
  });

  it('never reads the rival fleet: hiding or changing it changes no shot', () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat({ max: 60 }), fc.constantFrom(...LEVELS), (seed, n, level) => {
        const target = randomFleet(createRandom(seed));
        const shots: Shot[] = [];
        for (let i = 0; i < n && shots.filter((s) => s.sunk).length < 5; i++) {
          const move = chooseMove(firingView(shots), { level, seed });
          if (move?.kind !== 'shot') break;
          shots.push(resolveShot(target, shots, move));
        }
        const view = firingView(shots);
        const decoy = randomFleet(createRandom(seed + 1));
        const shown = { ...view, fleets: { X: view.fleets.X, O: decoy } };
        const unrelated = { ...view, fleets: { X: FLEET_B, O: target } };
        const move = chooseMove(view, { level, seed });
        expect(chooseMove(shown, { level, seed })).toEqual(move);
        expect(chooseMove(unrelated, { level, seed })).toEqual(move);
      }),
      { numRuns: 60 },
    );
  });

  it('follows a hit beside it, then along the line', () => {
    const hit = (name: string): Shot => ({ ...cell(name), outcome: 'hit' });
    const beside = new Set(['E4', 'G4', 'F3', 'F5'].map((name) => cellIndex(cell(name))));
    const ends = new Set(['F2', 'F5'].map((name) => cellIndex(cell(name))));
    for (const level of ['intermediate', 'advanced'] as const) {
      for (let seed = 0; seed < 20; seed++) {
        const first = chooseMove(firingView([hit('F4')]), { level, seed });
        expect(first?.kind === 'shot' && beside.has(cellIndex(first))).toBe(true);
        const second = chooseMove(firingView([hit('F4'), hit('F3')]), { level, seed });
        expect(second?.kind === 'shot' && ends.has(cellIndex(second))).toBe(true);
      }
    }
  });

  it('never fires where it knows there is water above the beginner level', () => {
    const sunk: Shot = {
      ...cell('C8'),
      outcome: 'sunk',
      sunk: { ship: 'destroyer', ...cell('C7'), orientation: 'h' },
    };
    const shots: Shot[] = [
      { ...cell('C7'), outcome: 'hit' },
      sunk,
      { ...cell('F4'), outcome: 'hit' },
    ];
    const known = new Set(
      [...shipRim(sunk.sunk!), cell('E3'), cell('E5'), cell('G3'), cell('G5')].map(cellIndex),
    );
    for (const level of ['intermediate', 'advanced'] as const) {
      for (let seed = 0; seed < 40; seed++) {
        const move = chooseMove(firingView(shots), { level, seed });
        expect(move?.kind === 'shot' && known.has(cellIndex(move as Cell))).toBe(false);
      }
    }
  });

  it('plays legal games to the end at every level, on both sides', () => {
    for (const x of LEVELS) {
      for (const o of LEVELS) {
        expect(['X', 'O']).toContain(game(x, o, 3));
      }
    }
  });

  it('needs fewer shots the stronger it plays', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => i);
    const average = Object.fromEntries(
      LEVELS.map((level) => [
        level,
        mean(seeds.map((seed) => shotsToSink(level, randomFleet(createRandom(1000 + seed)), seed))),
      ]),
    ) as Record<Level, number>;
    // Measured on these 40 fleets: 68.8, 44.6 and 38.9 shots (firing at random needs about 95).
    expect(average.beginner).toBeGreaterThan(average.intermediate + 15);
    expect(average.intermediate).toBeGreaterThan(average.advanced + 4);
    expect(average.advanced).toBeLessThan(42);
  });

  it('wins most games against the level below', () => {
    const wins = (strong: Level, weak: Level) =>
      Array.from({ length: 20 }, (_, seed) => seed).filter(
        (seed) =>
          game(seed % 2 ? strong : weak, seed % 2 ? weak : strong, seed) === (seed % 2 ? 'X' : 'O'),
      ).length;
    expect(wins('intermediate', 'beginner')).toBeGreaterThanOrEqual(15);
    expect(wins('advanced', 'intermediate')).toBeGreaterThanOrEqual(11);
  });
});
