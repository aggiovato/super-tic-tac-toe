import { describe, expect, it } from 'vitest';
import {
  judgeMove,
  type MoveContext,
  nextGame,
  otherSeat,
  gameRoomView,
} from '../../src/domain/game-room-rules';

const classic = (
  moves: readonly unknown[] = [],
  overrides: Partial<MoveContext> = {},
): MoveContext => ({
  setup: { gameId: 'classic', variant: '', rulesVersion: 1 },
  game: { game: 1, xSeat: 0, result: null },
  moves,
  full: true,
  ...overrides,
});

describe('judging a move', () => {
  it('accepts a legal move on its turn and revision', () => {
    expect(judgeMove(classic(), 0, 0, { cell: 4 })).toEqual({
      ok: true,
      result: null,
      move: { cell: 4 },
    });
  });

  it('refuses before the guest arrives, after the end, on an old revision or out of turn', () => {
    expect(judgeMove(classic([], { full: false }), 0, 0, { cell: 4 })).toEqual({
      ok: false,
      reason: 'waiting',
    });
    const over = classic([], { game: { game: 1, xSeat: 0, result: 'draw' } });
    expect(judgeMove(over, 0, 0, { cell: 4 })).toEqual({ ok: false, reason: 'game-over' });
    expect(judgeMove(classic([{ cell: 4 }]), 1, 0, { cell: 0 })).toEqual({
      ok: false,
      reason: 'stale',
    });
    expect(judgeMove(classic(), 1, 0, { cell: 4 })).toEqual({ ok: false, reason: 'not-your-turn' });
  });

  it('refuses what the engine refuses, and what is not a move of the game at all', () => {
    expect(judgeMove(classic([{ cell: 4 }]), 1, 1, { cell: 4 })).toEqual({
      ok: false,
      reason: 'illegal',
    });
    expect(judgeMove(classic([{ cell: 4 }]), 1, 1, { board: 9 })).toEqual({
      ok: false,
      reason: 'illegal',
    });
  });

  it('follows the symbols: with O on seat 0, seat 1 opens', () => {
    const swapped = classic([], { game: { game: 2, xSeat: 1, result: null } });
    expect(judgeMove(swapped, 1, 0, { cell: 4 }).ok).toBe(true);
    expect(judgeMove(swapped, 0, 0, { cell: 4 })).toEqual({ ok: false, reason: 'not-your-turn' });
  });

  it('names the winner by seat, whichever symbol it played', () => {
    // X: 0, 1 · O: 3, 4 · X plays 2 and wins the top row.
    const moves = [{ cell: 0 }, { cell: 3 }, { cell: 1 }, { cell: 4 }];
    expect(judgeMove(classic(moves), 0, 4, { cell: 2 })).toMatchObject({
      ok: true,
      result: 'won-0',
    });
    const swapped = classic(moves, { game: { game: 2, xSeat: 1, result: null } });
    expect(judgeMove(swapped, 1, 4, { cell: 2 })).toMatchObject({ ok: true, result: 'won-1' });
  });

  it('plays any game of the catalog with its own engine', () => {
    const dots: MoveContext = classic([], {
      setup: { gameId: 'dots', variant: '3', rulesVersion: 1 },
    });
    expect(judgeMove(dots, 0, 0, { orientation: 'h', row: 0, col: 0 }).ok).toBe(true);
    const super3t: MoveContext = classic([], {
      setup: { gameId: 'super-3t', variant: '', rulesVersion: 1 },
    });
    expect(judgeMove(super3t, 0, 0, { board: 4, cell: 2 }).ok).toBe(true);
  });
});

describe('the next game and what players see', () => {
  it('starts the next game only after the one that ended, symbols swapped', () => {
    expect(nextGame({ game: 1, xSeat: 0, result: 'won-0' }, 1)).toEqual({ game: 2, xSeat: 1 });
    expect(nextGame({ game: 1, xSeat: 0, result: null }, 1)).toBeNull();
    expect(nextGame({ game: 2, xSeat: 1, result: null }, 1)).toBeNull();
    expect(otherSeat(1)).toBe(0);
  });

  it('shows each seat the whole room, with who is in and who is online', () => {
    const view = gameRoomView(
      {
        setup: { gameId: 'classic', variant: '', rulesVersion: 1 },
        game: { game: 1, xSeat: 0, result: null },
        moves: [{ cell: 4 }],
        score: { wins: [0, 0], draws: 0 },
        taken: [0, 1],
        online: new Set([0] as const),
      },
      1,
    );
    expect(view).toMatchObject({ revision: 1, you: 1, gameId: 'classic' });
    expect(view.seats).toEqual([
      { taken: true, online: true },
      { taken: true, online: false },
    ]);
  });
});

// Ship Sink: placements at once, and each seat sent only its view.
const FLEET_A = [
  { ship: 'carrier', row: 0, col: 0, orientation: 'h' },
  { ship: 'battleship', row: 2, col: 0, orientation: 'v' },
  { ship: 'cruiser', row: 2, col: 2, orientation: 'h' },
  { ship: 'submarine', row: 6, col: 4, orientation: 'v' },
  { ship: 'destroyer', row: 9, col: 7, orientation: 'h' },
] as const;
const FLEET_B = [
  { ship: 'carrier', row: 9, col: 0, orientation: 'h' },
  { ship: 'battleship', row: 0, col: 9, orientation: 'v' },
  { ship: 'cruiser', row: 4, col: 3, orientation: 'h' },
  { ship: 'submarine', row: 0, col: 5, orientation: 'v' },
  { ship: 'destroyer', row: 6, col: 7, orientation: 'v' },
] as const;
const placeX = { kind: 'place', player: 'X', fleet: FLEET_A };
const placeO = { kind: 'place', player: 'O', fleet: FLEET_B };
const fleet = (moves: readonly unknown[] = []): MoveContext => ({
  setup: { gameId: 'fleet', variant: '', rulesVersion: 1 },
  game: { game: 1, xSeat: 0, result: null },
  moves,
  full: true,
});

describe('a game of hidden information (Ship Sink)', () => {
  it('takes both placements in either order, even on an older revision', () => {
    expect(judgeMove(fleet(), 1, 0, placeO).ok).toBe(true);
    // Seat 0 placed on revision 0 while seat 1's placement landed first: still its to make.
    expect(judgeMove(fleet([placeO]), 0, 0, placeX).ok).toBe(true);
    expect(judgeMove(fleet([placeX]), 0, 0, placeX)).toEqual({ ok: false, reason: 'stale' });
    expect(judgeMove(fleet([placeX]), 0, 1, placeX)).toEqual({
      ok: false,
      reason: 'not-your-turn',
    });
  });

  it('takes an older revision only for a move made while both could move', () => {
    // X fired (water) and O fired (water): X's turn again. A shot made on revision 2, before those
    // two shots, was aimed at a board its player never saw: stale.
    const fired = [
      placeX,
      placeO,
      { kind: 'shot', row: 1, col: 1 },
      { kind: 'shot', row: 1, col: 1 },
    ];
    expect(judgeMove(fleet(fired), 0, 2, { kind: 'shot', row: 3, col: 3 })).toEqual({
      ok: false,
      reason: 'stale',
    });
    expect(judgeMove(fleet(fired), 0, 4, { kind: 'shot', row: 3, col: 3 }).ok).toBe(true);
  });

  it("says why a move on an older revision is refused when it is not this game's move at all", () => {
    expect(judgeMove(fleet([placeO]), 0, 0, null)).toEqual({ ok: false, reason: 'illegal' });
  });

  it('keeps the move as the engine stored it, never extra fields the client sent', () => {
    const verdict = judgeMove(fleet([placeX, placeO]), 0, 2, {
      kind: 'shot',
      row: 9,
      col: 0,
      outcome: 'sunk',
      cheat: true,
    });
    expect(verdict).toEqual({ ok: true, result: null, move: { kind: 'shot', row: 9, col: 0 } });
  });

  it("refuses a shot out of turn and a placement in the other seat's name", () => {
    expect(judgeMove(fleet([placeX, placeO]), 1, 2, { kind: 'shot', row: 0, col: 0 })).toEqual({
      ok: false,
      reason: 'not-your-turn',
    });
    // Neither fleet is placed yet: seat 1 (O) still may not place X's.
    expect(judgeMove(fleet(), 1, 0, { ...placeO, player: 'X' })).toEqual({
      ok: false,
      reason: 'not-your-turn',
    });
  });

  it('sends each seat its own fleet and only the fact that the rival placed', () => {
    const room = {
      setup: { gameId: 'fleet' as const, variant: '', rulesVersion: 1 },
      game: { game: 1, xSeat: 0 as const, result: null },
      moves: [placeX, placeO, { kind: 'shot', row: 9, col: 0 }],
      score: { wins: [0, 0] as const, draws: 0 },
      taken: [0, 1] as const,
      online: new Set<0 | 1>(),
    };
    const host = gameRoomView(room, 0);
    const guest = gameRoomView(room, 1);
    expect(host.moves).toEqual([
      placeX,
      { kind: 'place', player: 'O' },
      { kind: 'shot', row: 9, col: 0, outcome: 'hit' },
    ]);
    expect(guest.moves).toEqual([
      { kind: 'place', player: 'X' },
      placeO,
      { kind: 'shot', row: 9, col: 0, outcome: 'hit' },
    ]);
    expect(JSON.stringify(guest)).not.toContain('"carrier","row":0');
    expect(host.revision).toBe(3);
  });
});
