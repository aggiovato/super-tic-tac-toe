import { describe, expect, it } from 'vitest';
import {
  CLASSIC_GAME,
  DOTS_GAME,
  GAME_IDS,
  GAMES,
  gameById,
  isGameId,
  SUPER3T_GAME,
} from './index';

describe('the catalog', () => {
  it('lists each game once, with Super 3T as the one featured game', () => {
    expect(new Set(GAME_IDS).size).toBe(GAMES.length);
    expect(GAMES.filter((game) => game.featured).map((game) => game.id)).toEqual(['super-3t']);
  });

  it('finds a game by id and refuses an unknown one', () => {
    expect(gameById('dots')).toBe(DOTS_GAME);
    expect(() => gameById('chess' as never)).toThrow('Unknown game: chess');
    expect(isGameId('classic')).toBe(true);
    expect(isGameId('chess')).toBe(false);
  });

  it('reads an empty or unknown variant as the default board', () => {
    expect(DOTS_GAME.variants).toEqual(['3', '5']);
    expect(DOTS_GAME.variantOf(undefined)).toBe('3');
    expect(DOTS_GAME.variantOf('')).toBe('3');
    expect(DOTS_GAME.variantOf('7')).toBe('3');
    expect(DOTS_GAME.variantOf('5')).toBe('5');
    expect(SUPER3T_GAME.variants).toEqual(['']);
    expect(CLASSIC_GAME.variantOf('5')).toBe('');
  });

  it("plays each game's engine: a legal move applies and equals itself", () => {
    for (const game of GAMES) {
      const rules = gameById(game.id).rules;
      const start = rules.replay([], game.rulesVersion, game.variants[0] ?? '');
      expect(start.ok).toBe(true);
      const [move] = rules.legalMoves(start.state);
      expect(rules.sameMove(move, move)).toBe(true);
      expect(rules.apply(start.state, move).ok).toBe(true);
    }
  });
});
