import { createRandom } from '@tictac';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves, mayMove, sameMove } from './engine';
import { fleetProblem, randomFleet, shipRim } from './fleet';
import type { Fleet, GameState, Move } from './models';
import { replay } from './replay';
import { cell, fleet, FLEET_A, FLEET_B, label, play, shots, SINK_A, SINK_B } from './testing';

const FLEETS = { X: FLEET_A, O: FLEET_B };

/** Tries one move and returns why it was refused, checking the state stayed the same. */
function refusal(state: GameState, move: Move): string {
  const result = applyMove(state, move);
  if (result.ok) throw new Error('expected a refusal');
  expect(result.state).toBe(state);
  return result.reason;
}

const shot = (name: string): Move => ({ kind: 'shot', ...cell(name) });

describe('the Ship Sink engine: placing', () => {
  it('opens with both fleets to place, X to fire first and nothing to shoot yet', () => {
    const start = initialState();
    expect(start.phase).toBe('placing');
    expect(start.turn).toBe('X');
    expect(legalMoves(start)).toEqual([]);
    expect(mayMove(start, 'X')).toBe(true);
    expect(mayMove(start, 'O')).toBe(true);
  });

  it('takes the fleets in either order and starts firing once both are placed', () => {
    const oFirst = applyMove(initialState(), { kind: 'place', player: 'O', fleet: FLEET_B });
    expect(oFirst.ok && oFirst.state.phase).toBe('placing');
    if (!oFirst.ok) return;
    expect(mayMove(oFirst.state, 'O')).toBe(false);
    expect(mayMove(oFirst.state, 'X')).toBe(true);
    const both = applyMove(oFirst.state, { kind: 'place', player: 'X', fleet: FLEET_A });
    expect(both.ok && both.state.phase).toBe('firing');
    expect(both.ok && legalMoves(both.state)).toHaveLength(100);
    expect(both.ok && mayMove(both.state, 'X')).toBe(true);
    expect(both.ok && mayMove(both.state, 'O')).toBe(false);
  });

  it('refuses a second fleet for the same player and any fleet once firing', () => {
    const placed = applyMove(initialState(), { kind: 'place', player: 'X', fleet: FLEET_A });
    if (!placed.ok) throw new Error('placement refused');
    expect(refusal(placed.state, { kind: 'place', player: 'X', fleet: FLEET_B })).toBe(
      'already-placed',
    );
    expect(refusal(play(FLEETS), { kind: 'place', player: 'O', fleet: FLEET_A })).toBe(
      'already-placed',
    );
  });

  it('refuses a shot while a fleet is still to place', () => {
    const placed = applyMove(initialState(), { kind: 'place', player: 'X', fleet: FLEET_A });
    if (!placed.ok) throw new Error('placement refused');
    expect(refusal(initialState(), shot('A1'))).toBe('placing');
    expect(refusal(placed.state, shot('A1'))).toBe('placing');
  });

  it('refuses a fleet that breaks a rule, and says which', () => {
    const carrier = FLEET_A[0];
    const cases: [string, Fleet][] = [
      ['composition', FLEET_A.slice(1)],
      ['composition', [...FLEET_A.slice(0, 4), { ...carrier, row: 9, col: 0 }]],
      ['composition', FLEET_A.map((p, i) => (i === 0 ? { ...p, orientation: 'd' as 'h' } : p))],
      ['out-of-bounds', fleet('A7h C1v C3h G5v J8h')],
      ['out-of-bounds', fleet('A1h H1v C3h G5v J8h')],
      ['overlap', fleet('A1h C1v C1h G5v J8h')],
      ['touching', fleet('A1h B1h D3h G5v J8h')],
      ['touching', fleet('A1h C1v G1h B6v J8h')],
    ];
    for (const [problem, wrong] of cases) {
      expect(fleetProblem(wrong), problem).toBe(problem);
      expect(refusal(initialState(), { kind: 'place', player: 'X', fleet: wrong })).toBe(
        'invalid-fleet',
      );
    }
    expect(fleetProblem(FLEET_A)).toBeNull();
    expect(fleetProblem(FLEET_B)).toBeNull();
  });

  it('stores a fleet in ship order, whatever order it was given in', () => {
    const state = play({ X: [...FLEET_A].reverse(), O: FLEET_B });
    expect(state.fleets.X).toEqual(FLEET_A);
    expect(state.moves[0]).toEqual({ kind: 'place', player: 'X', fleet: FLEET_A });
  });
});

describe('the Ship Sink engine: firing', () => {
  it('passes the turn after water', () => {
    const state = play(FLEETS, 'B1');
    expect(state.shots.X).toEqual([{ ...cell('B1'), outcome: 'water' }]);
    expect(state.turn).toBe('O');
  });

  it('fires again after a hit', () => {
    const result = applyMove(play(FLEETS), shot('J1'));
    expect(result.ok && result.shot).toEqual({ ...cell('J1'), outcome: 'hit' });
    expect(result.ok && result.state.turn).toBe('X');
  });

  it('names the ship a sinking shot sank, and fires again', () => {
    const state = play(FLEETS, 'G8 H8');
    expect(state.shots.X.at(-1)).toEqual({
      ...cell('H8'),
      outcome: 'sunk',
      sunk: { ship: 'destroyer', ...cell('G8'), orientation: 'v' },
    });
    expect(state.turn).toBe('X');
  });

  it('counts the hits of earlier turns when a ship sinks', () => {
    // X hits G8, misses; O misses; X sinks the destroyer with H8.
    const state = play(FLEETS, 'G8 A1 B2 H8');
    expect(state.shots.O).toEqual([{ ...cell('B2'), outcome: 'water' }]);
    expect(state.shots.X.at(-1)?.outcome).toBe('sunk');
  });

  it('refuses a cell fired at already and one off the board', () => {
    const state = play(FLEETS, 'B1 B2');
    expect(state.turn).toBe('X');
    expect(refusal(state, shot('B1'))).toBe('already-shot');
    expect(refusal(state, { kind: 'shot', row: 10, col: 0 })).toBe('invalid-coordinates');
    expect(refusal(state, { kind: 'shot', row: 0.5, col: 0 })).toBe('invalid-coordinates');
    // O fired at B2, which X has not: still free for X.
    expect(applyMove(state, shot('B2')).ok).toBe(true);
  });

  it('lets each player shoot only the rival waters, from their own count', () => {
    const state = play(FLEETS, 'B1');
    expect(legalMoves(state)).toHaveLength(100);
    expect(legalMoves(play(FLEETS, 'B1 B1'))).toHaveLength(99);
  });

  it('is won by sinking the last ship, and then refuses every move', () => {
    const state = play(FLEETS, SINK_B);
    expect(state.status).toEqual({ kind: 'won', winner: 'X' });
    expect(state.phase).toBe('over');
    expect(state.shots.X.filter((s) => s.outcome === 'sunk')).toHaveLength(5);
    expect(legalMoves(state)).toEqual([]);
    expect(mayMove(state, 'X')).toBe(false);
    expect(refusal(state, shot('A1'))).toBe('game-over');
    expect(refusal(state, { kind: 'place', player: 'X', fleet: FLEET_A })).toBe('game-over');
  });

  it('lets O win too', () => {
    const state = play(FLEETS, `B1 ${SINK_A}`);
    expect(state.status).toEqual({ kind: 'won', winner: 'O' });
  });
});

describe('the Ship Sink engine: moves and replay', () => {
  it('tells moves apart', () => {
    const place: Move = { kind: 'place', player: 'X', fleet: FLEET_A };
    expect(sameMove(shot('A1'), shot('A1'))).toBe(true);
    expect(sameMove(shot('A1'), shot('A2'))).toBe(false);
    expect(sameMove(place, { ...place, fleet: [...FLEET_A].reverse() })).toBe(true);
    expect(sameMove(place, { ...place, player: 'O' })).toBe(false);
    expect(sameMove(place, { ...place, fleet: FLEET_B })).toBe(false);
    expect(sameMove(place, shot('A1'))).toBe(false);
    expect(sameMove(shot('A1'), place)).toBe(false);
  });

  it('rebuilds a game from its moves', () => {
    const game = play(FLEETS, 'B1 B2 J1 J2 A1');
    const rebuilt = replay(game.moves, 1);
    expect(rebuilt).toEqual({ ok: true, state: game });
  });

  it('refuses another rules version and stops at the first illegal move', () => {
    expect(replay([], 2)).toEqual({ ok: false, reason: 'unsupported-rules-version' });
    const moves = [...play(FLEETS).moves, ...shots('B1 B2 B1')];
    const result = replay(moves, 1);
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason !== 'unsupported-rules-version') {
      expect(result.reason).toBe('already-shot');
      expect(result.index).toBe(4);
      expect(result.state.revision).toBe(4);
    }
  });
});

describe('fleet geometry', () => {
  it('rims a ship with the cells around it, inside the board', () => {
    expect(
      shipRim({ ship: 'destroyer', ...cell('A1'), orientation: 'h' })
        .map(label)
        .sort(),
    ).toEqual(['A3', 'B1', 'B2', 'B3']);
    expect(shipRim({ ship: 'destroyer', ...cell('E5'), orientation: 'v' })).toHaveLength(10);
  });

  it('places a random fleet that keeps every rule, the same for the same seed', () => {
    for (let seed = 0; seed < 1000; seed++) {
      expect(fleetProblem(randomFleet(createRandom(seed)))).toBeNull();
    }
    expect(randomFleet(createRandom(7))).toEqual(randomFleet(createRandom(7)));
    expect(randomFleet(createRandom(7))).not.toEqual(randomFleet(createRandom(8)));
  });
});
