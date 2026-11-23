import { COMPUTER_LEVELS, type GameDefinition } from '@catalog';
import { type GameRecord, sideOf } from '@storage';
import type { HistoryEntry, HistoryStats, LevelStats, Outcome } from './history.model';

/** Latest games listed, and shown on the flap strip. */
export const RECENT_GAMES = 10;
/** Latest games against each level on the form chart. */
export const FORM_GAMES = 10;
/** Latest games on the length chart. */
export const LENGTH_GAMES = 20;
/** Fewer finished games than this show the figures without charts: a chart of one dot says nothing. */
export const CHART_MIN_GAMES = 3;

function outcomeOf(record: GameRecord): Outcome {
  if (sideOf(record).mode !== 'computer') {
    return 'people';
  }
  return record.result === 'draw' ? 'drawn' : record.result === 'won-0' ? 'won' : 'lost';
}

function entryOf(record: GameRecord, variant: string): HistoryEntry {
  const winner = record.result === 'won-0' ? 0 : record.result === 'won-1' ? 1 : null;
  return {
    id: record.id,
    variant,
    outcome: outcomeOf(record),
    winner,
    winnerMark: winner === null ? null : winner === record.xPlayer ? 'x' : 'o',
    moves: record.revision,
    finishedAt: record.finishedAt ?? record.updatedAt,
  };
}

function levelsOf(entries: readonly { entry: HistoryEntry; record: GameRecord }[]): LevelStats[] {
  return COMPUTER_LEVELS.map((level) => {
    const against = entries
      .filter(({ record }) => {
        const side = sideOf(record);
        return side.mode === 'computer' && side.level === level;
      })
      .map(({ entry }) => entry);
    const count = (outcome: Outcome) => against.filter((e) => e.outcome === outcome).length;
    return {
      level,
      wins: count('won'),
      draws: count('drawn'),
      losses: count('lost'),
      form: against
        .slice(0, FORM_GAMES)
        .map((e) => e.outcome)
        .reverse(),
    };
  });
}

/**
 * A game's history from its finished games (newest first, as the repository gives them): results
 * by size and level, the totals against the computer, the latest games and their lengths. Sizes
 * come in the game's order, only those played; with none played, the first, so the table is there.
 */
export function historyStats(
  games: readonly GameRecord[],
  game: Pick<GameDefinition, 'variants' | 'variantOf'>,
): HistoryStats {
  const entries = games.map((record) => ({
    record,
    entry: entryOf(record, game.variantOf(record.variant)),
  }));
  const played = game.variants.filter((v) => entries.some(({ entry }) => entry.variant === v));
  const variants = (played.length > 0 ? played : game.variants.slice(0, 1)).map((variant) => {
    const on = entries.filter(({ entry }) => entry.variant === variant);
    return {
      variant,
      levels: levelsOf(on),
      people: on.filter(({ entry }) => entry.outcome === 'people').length,
    };
  });
  const all = entries.map(({ entry }) => entry);
  const count = (outcome: Outcome) => all.filter((e) => e.outcome === outcome).length;
  return {
    finished: all.length,
    totals: { wins: count('won'), draws: count('drawn'), losses: count('lost') },
    variants,
    recent: all.slice(0, RECENT_GAMES),
    lengths: all.slice(0, LENGTH_GAMES).reverse(),
  };
}
