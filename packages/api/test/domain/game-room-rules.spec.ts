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
    expect(judgeMove(classic(), 0, 0, { cell: 4 })).toEqual({ ok: true, result: null });
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
    expect(judgeMove(classic(moves), 0, 4, { cell: 2 })).toEqual({ ok: true, result: 'won-0' });
    const swapped = classic(moves, { game: { game: 2, xSeat: 1, result: null } });
    expect(judgeMove(swapped, 1, 4, { cell: 2 })).toEqual({ ok: true, result: 'won-1' });
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
