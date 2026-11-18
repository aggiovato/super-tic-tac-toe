import { describe, expect, it } from 'vitest';
import { replay } from './replay';
import { RULES_VERSION } from './models';
import { CLOSES_OWN_TARGET, GLOBAL_DIAGONAL_WIN, GLOBAL_DRAW, parseMoves, play } from './testing';

describe('replay', () => {
  it.each([
    ['a game in progress', CLOSES_OWN_TARGET],
    ['a won game', GLOBAL_DIAGONAL_WIN],
    ['a drawn game', GLOBAL_DRAW],
  ])('rebuilds exactly the same position for %s', (_, notation) => {
    const result = replay(parseMoves(notation), RULES_VERSION);
    expect(result).toEqual({ ok: true, state: play(notation) });
  });

  it('is deterministic across runs', () => {
    const moves = parseMoves(GLOBAL_DRAW);
    expect(replay(moves, RULES_VERSION)).toEqual(replay(moves, RULES_VERSION));
  });

  it('replays no moves to the opening', () => {
    expect(replay([], RULES_VERSION)).toEqual({ ok: true, state: play('') });
  });

  it('stops at the first illegal move with its index and the last valid state', () => {
    const result = replay(parseMoves('4.2 2.4 3.0 4.0'), RULES_VERSION);
    expect(result).toEqual({
      ok: false,
      reason: 'wrong-board',
      index: 2,
      state: play('4.2 2.4'),
    });
  });

  it('refuses an unknown rules version', () => {
    expect(replay(parseMoves('4.2'), 2)).toEqual({
      ok: false,
      reason: 'unsupported-rules-version',
    });
  });
});
