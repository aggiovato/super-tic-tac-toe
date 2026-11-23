import { CLASSIC_GAME, DOTS_GAME } from '@catalog';
import type { GameRecord } from '@storage';
import { historyStats, LENGTH_GAMES, RECENT_GAMES } from './history-stats';

let next = 0;

/** A finished game; the newest are made last and listed first, as the repository gives them. */
function finished(
  result: GameRecord['result'],
  opponent: 'local' | 'beginner' | 'advanced',
  extra: Partial<GameRecord> = {},
): GameRecord {
  next++;
  return {
    id: `g${next}`,
    gameId: 'classic',
    schemaVersion: 2,
    rulesVersion: 1,
    seriesId: 's',
    seats: [
      { kind: 'local' },
      opponent === 'local' ? { kind: 'local' } : { kind: 'computer', level: opponent },
    ],
    seed: 1,
    xPlayer: 0,
    moves: [],
    revision: next,
    result,
    startedAt: next,
    updatedAt: next,
    finishedAt: next,
    ...extra,
  };
}

describe('historyStats', () => {
  it('shows an empty table for the first size when nothing was played', () => {
    const stats = historyStats([], DOTS_GAME);
    expect(stats.finished).toBe(0);
    expect(stats.variants.map((v) => v.variant)).toEqual(['3']);
    expect(stats.variants[0]?.levels.every((l) => l.wins + l.draws + l.losses === 0)).toBe(true);
  });

  it('counts results against each level for the person, and two-person games apart', () => {
    const games = [
      finished('won-0', 'beginner'),
      finished('won-1', 'beginner'),
      finished('draw', 'advanced'),
      finished('won-1', 'local'),
    ].reverse();
    const stats = historyStats(games, CLASSIC_GAME);
    expect(stats.totals).toEqual({ wins: 1, draws: 1, losses: 1 });
    const [section] = stats.variants;
    expect(section?.people).toBe(1);
    expect(section?.levels.map((l) => [l.level, l.wins, l.draws, l.losses])).toEqual([
      ['beginner', 1, 0, 1],
      ['intermediate', 0, 0, 0],
      ['advanced', 0, 1, 0],
    ]);
    // Form reads oldest first.
    expect(section?.levels[0]?.form).toEqual(['won', 'lost']);
  });

  it('keeps each board size apart, in the game order', () => {
    const games = [
      finished('won-0', 'beginner', { variant: '5' }),
      finished('won-0', 'beginner', { variant: '3' }),
    ];
    const stats = historyStats(games, DOTS_GAME);
    expect(stats.variants.map((v) => [v.variant, v.levels[0]?.wins])).toEqual([
      ['3', 1],
      ['5', 1],
    ]);
  });

  it('names the winner by symbol, which swaps with the series', () => {
    const [entry] = historyStats([finished('won-0', 'local', { xPlayer: 1 })], CLASSIC_GAME).recent;
    expect(entry).toMatchObject({ winner: 0, winnerMark: 'o', outcome: 'people' });
  });

  it('lists the latest games newest first and their lengths oldest first', () => {
    const games = Array.from({ length: 25 }, () => finished('draw', 'beginner')).reverse();
    const stats = historyStats(games, CLASSIC_GAME);
    expect(stats.recent).toHaveLength(RECENT_GAMES);
    expect(stats.recent[0]?.id).toBe(games[0]?.id);
    expect(stats.lengths).toHaveLength(LENGTH_GAMES);
    expect(stats.lengths.at(-1)?.id).toBe(games[0]?.id);
  });
});
