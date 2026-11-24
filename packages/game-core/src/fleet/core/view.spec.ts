import { createRandom, type Player } from '@tictac';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyMove, initialState, legalMoves, other } from './engine';
import { cellIndex, randomFleet, shipCells } from './fleet';
import type { GameState, Move } from './models';
import { FLEET_A, FLEET_B, play, SINK_B } from './testing';
import { redactMoves, replayView, viewOf, type ViewMove } from './view';

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
  const rival = other(viewer);
  const sunk = state.shots[viewer].flatMap((shot) => (shot.sunk ? [shot.sunk.ship] : []));
  return new Set(
    (state.fleets[rival] ?? [])
      .filter((ship) => !sunk.includes(ship.ship))
      .flatMap(shipCells)
      .map(cellIndex),
  );
}

const game = fc.tuple(fc.nat(), fc.array(fc.integer({ min: -3, max: 200 }), { maxLength: 220 }));

describe('what each player sees', () => {
  it('shows the viewer their own fleet and hides the rival one', () => {
    const view = viewOf(play(FLEETS, 'J1 B1'), 'O');
    expect(view.fleets).toEqual({ X: null, O: FLEET_B });
    expect(view.placed).toEqual({ X: true, O: true });
    expect(view.moves.slice(0, 2)).toEqual([
      { kind: 'place', player: 'X' },
      { kind: 'place', player: 'O', fleet: FLEET_B },
    ]);
    expect(view.moves.slice(2)).toEqual([
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
    expect(over.moves[0]).toEqual({ kind: 'place', player: 'X', fleet: FLEET_A });
  });

  it('rebuilds from the moves it was sent exactly the view of the full game', () => {
    fc.assert(
      fc.property(game, ([seed, picks]) => {
        const state = drive(seed, picks);
        for (const viewer of ['X', 'O'] as const) {
          const view = viewOf(state, viewer);
          expect(replayView(view.moves, 1, viewer)).toEqual({ ok: true, view });
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
          const view = viewOf(state, viewer);
          const shown = [
            ...(view.fleets[other(viewer)] ?? []),
            ...view.moves.flatMap((move) =>
              move.kind === 'place' ? (move.player === viewer ? [] : (move.fleet ?? [])) : [],
            ),
            ...view.moves.flatMap((move) => (move.kind === 'shot' && move.sunk ? [move.sunk] : [])),
          ].flatMap(shipCells);
          expect(shown.filter((cell) => floating.has(cellIndex(cell)))).toEqual([]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('refuses moves no game could produce', () => {
    const place = (player: Player): ViewMove => ({ kind: 'place', player });
    const water: ViewMove = { kind: 'shot', row: 0, col: 0, outcome: 'water' };
    expect(replayView([], 2, 'X')).toEqual({ ok: false, reason: 'unsupported-rules-version' });
    expect(replayView([place('X'), water], 1, 'X')).toEqual({ ok: false, reason: 'inconsistent' });
    expect(replayView([place('X'), place('X')], 1, 'X')).toEqual({
      ok: false,
      reason: 'inconsistent',
    });
    const over = viewOf(play(FLEETS, SINK_B), 'X');
    expect(replayView([...over.moves, water], 1, 'X').ok).toBe(false);
    expect(replayView([...over.moves, place('O')], 1, 'X').ok).toBe(false);
  });

  it('refuses to redact a state its moves cannot produce', () => {
    const state = play(FLEETS);
    const broken = { ...state, moves: [...state.moves, state.moves[0]] };
    expect(() => redactMoves(broken, 'X')).toThrow(/illegal/);
  });
});
