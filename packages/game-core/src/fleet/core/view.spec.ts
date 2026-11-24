import { createRandom, type Player } from '@tictac';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves, mayMove, other } from './engine';
import { cellIndex, randomFleet, shipCells } from './fleet';
import type { GameState, Move } from './models';
import { FLEET_A, FLEET_B, play, SINK_B } from './testing';
import { redactMoves, replayView, viewOf } from './view';

const FLEETS = { X: FLEET_A, O: FLEET_B };

/**
 * A game from the opening driven by numbers: random fleets from `seed`, then each number picks a
 * shot among the legal ones, or (when it is negative) tries a refused move, which must keep the
 * state as it was.
 */
function drive(seed: number, picks: readonly number[]): GameState {
  const random = createRandom(seed);
  let state = initialState();
  for (const player of seed % 2 ? (['O', 'X'] as const) : (['X', 'O'] as const)) {
    const placed = applyMove(state, { kind: 'place', player, fleet: randomFleet(random) });
    if (!placed.ok) throw new Error(placed.reason);
    state = placed.state;
  }
  for (const pick of picks) {
    const moves = legalMoves(state);
    const fired = state.shots[state.turn][0];
    const wrong: Move[] = [
      { kind: 'shot', row: -1, col: 3 },
      { kind: 'place', player: 'X', fleet: FLEET_A },
      ...(fired ? [{ kind: 'shot' as const, row: fired.row, col: fired.col }] : []),
    ];
    const move = pick < 0 ? wrong[-pick % wrong.length] : moves[pick % Math.max(moves.length, 1)];
    if (!move) break;
    const result = applyMove(state, move);
    if (pick < 0) {
      expect(result.ok).toBe(false);
      expect(result.state).toBe(state);
    } else if (result.ok) {
      state = result.state;
    }
  }
  return state;
}

/** Cells of `viewer`'s rival's ships that still float. */
function floatingRivalCells(state: GameState, viewer: Player): Set<number> {
  const sunk = state.shots[viewer].flatMap((shot) => (shot.sunk ? [shot.sunk.ship] : []));
  return new Set(
    (state.fleets[other(viewer)] ?? [])
      .filter((ship) => !sunk.includes(ship.ship))
      .flatMap(shipCells)
      .map(cellIndex),
  );
}

const game = fc.tuple(fc.nat(), fc.array(fc.integer({ min: -3, max: 200 }), { maxLength: 220 }));

describe('what each player sees', () => {
  it('shows the viewer their own fleet and hides the rival one', () => {
    const view = viewOf(play(FLEETS, 'J1 B1'), 'O');
    expect(view.viewer).toBe('O');
    expect(view.fleets).toEqual({ X: null, O: FLEET_B });
    expect(view.placed).toEqual({ X: true, O: true });
    expect(view.moves).toEqual([
      { kind: 'place', player: 'X' },
      { kind: 'place', player: 'O', fleet: FLEET_B },
      { kind: 'shot', row: 9, col: 0, outcome: 'hit' },
      { kind: 'shot', row: 1, col: 0, outcome: 'water' },
    ]);
  });

  it('shows a sunk ship where it lay, and every fleet once the game is over', () => {
    const sunk = viewOf(play(FLEETS, 'G8 H8'), 'X');
    expect(sunk.moves.at(-1)).toMatchObject({ outcome: 'sunk', sunk: { ship: 'destroyer' } });
    expect(sunk.fleets.O).toBeNull();
    const over = viewOf(play(FLEETS, SINK_B), 'O');
    expect(over.fleets).toEqual(FLEETS);
    expect(over.status).toEqual({ kind: 'won', winner: 'X' });
    expect(redactMoves(play(FLEETS, SINK_B), 'O')[0]).toEqual({
      kind: 'place',
      player: 'X',
      fleet: FLEET_A,
    });
  });

  it('agrees with the whole game on everything but the hidden fleet', () => {
    fc.assert(
      fc.property(game, ([seed, picks]) => {
        const state = drive(seed, picks);
        for (const viewer of ['X', 'O'] as const) {
          const view = viewOf(state, viewer);
          const fleets =
            state.phase === 'over' ? state.fleets : { ...state.fleets, [other(viewer)]: null };
          expect(view).toMatchObject({
            phase: state.phase,
            turn: state.turn,
            status: state.status,
            placed: state.placed,
            shots: state.shots,
            fleets,
            revision: state.revision,
          });
          expect(replayView(view.moves, 1, viewer)).toEqual({ ok: true, state: view });
        }
      }),
      { numRuns: 100 },
    );
  });

  it('never sends a cell of a rival ship that still floats', () => {
    fc.assert(
      fc.property(game, ([seed, picks]) => {
        const state = drive(seed, picks);
        if (state.phase === 'over') return;
        for (const viewer of ['X', 'O'] as const) {
          const floating = floatingRivalCells(state, viewer);
          const sent = redactMoves(state, viewer);
          const shown = [
            ...sent.flatMap((move) =>
              move.kind === 'place' && move.player !== viewer ? (move.fleet ?? []) : [],
            ),
            ...sent.flatMap((move) => (move.kind === 'shot' && move.sunk ? [move.sunk] : [])),
            ...(viewOf(state, viewer).fleets[other(viewer)] ?? []),
          ].flatMap(shipCells);
          expect(shown.filter((cell) => floating.has(cellIndex(cell)))).toEqual([]);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('a view on its way', () => {
  it('holds a shot of its own as pending until the outcome comes', () => {
    const view = viewOf(play(FLEETS), 'X');
    const sent = applyMove(view, { kind: 'shot', row: 9, col: 0 });
    if (!sent.ok) throw new Error(sent.reason);
    expect(sent.state.shots.X).toEqual([{ row: 9, col: 0, outcome: 'pending' }]);
    expect(sent.state.moves.at(-1)).toEqual({ kind: 'shot', row: 9, col: 0 });
    expect(sent.state.turn).toBe('X');
    expect(mayMove(sent.state, 'X')).toBe(false);
    expect(legalMoves(sent.state)).toEqual([]);
    expect(applyMove(sent.state, { kind: 'shot', row: 0, col: 0 })).toMatchObject({
      ok: false,
      reason: 'pending',
    });
    // The server's answer replaces the pending shot: the view is rebuilt from its moves.
    expect(replayView(viewOf(play(FLEETS, 'J1'), 'X').moves, 1, 'X')).toMatchObject({
      ok: true,
      state: { shots: { X: [{ row: 9, col: 0, outcome: 'hit' }] }, turn: 'X' },
    });
  });

  it("works out the rival's shot at its own fleet when it comes without an outcome", () => {
    // X missed at B1; O fires at A1, a cell of X's own carrier.
    const view = viewOf(play(FLEETS, 'B1'), 'X');
    const shot = applyMove(view, { kind: 'shot', row: 0, col: 0 });
    expect(shot.ok && shot.state.shots.O).toEqual([{ row: 0, col: 0, outcome: 'hit' }]);
  });

  it('takes its own placement and the rival one without a fleet, in either order', () => {
    const rivalFirst = replayView(
      [
        { kind: 'place', player: 'O' },
        { kind: 'place', player: 'X', fleet: FLEET_A },
      ],
      1,
      'X',
    );
    expect(rivalFirst).toMatchObject({ ok: true, state: { phase: 'firing', fleets: { O: null } } });
    expect(mayMove(initialState('X'), 'O')).toBe(true);
  });

  it('refuses moves no game could produce', () => {
    const refusal = (moves: Move[]) => {
      const result = replayView(moves, 1, 'X');
      return result.ok ? null : result.reason;
    };
    const water: Move = { kind: 'shot', row: 0, col: 0, outcome: 'water' };
    expect(refusal([])).toBeNull();
    expect(replayView([], 2, 'X')).toEqual({ ok: false, reason: 'unsupported-rules-version' });
    expect(refusal([{ kind: 'place', player: 'X' }])).toBe('invalid-fleet');
    expect(refusal([{ kind: 'place', player: 'O' }, water])).toBe('placing');
    expect(
      refusal([
        { kind: 'place', player: 'O' },
        { kind: 'place', player: 'O' },
      ]),
    ).toBe('already-placed');
    const over = viewOf(play(FLEETS, SINK_B), 'X');
    expect(refusal([...over.moves, water])).toBe('game-over');
  });

  it('refuses to redact a view or a state its moves cannot produce', () => {
    const state = play(FLEETS);
    expect(() => redactMoves(viewOf(state, 'X'), 'X')).toThrow(/nothing more to hide/);
    const broken = { ...state, moves: [...state.moves, state.moves[0]] };
    expect(() => redactMoves(broken, 'X')).toThrow(/illegal/);
  });
});
