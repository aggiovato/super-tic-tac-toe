import type { ComputerLevel } from '@catalog';
import type { FlapTile } from '@ui';
import type { FormRow } from '../form-chart/form-row.model';

/** What the ticket shows: still reading, a failed read, no finished game yet, or the history. */
export type HistoryState = 'loading' | 'error' | 'empty' | 'ready';

/** The ticket's two parts, as tabs on phones and as two tickets on wide screens. */
export type HistoryPart = 'results' | 'recent';

/** One of the totals on the stub: its flaps and its caption. */
export interface TotalView {
  readonly key: 'wins' | 'draws' | 'losses';
  readonly caption: string;
  readonly tiles: readonly FlapTile[];
}

/** A level's row in the results table, with its share of wins, draws and losses in %. */
export interface LevelRowView {
  readonly level: ComputerLevel;
  readonly name: string;
  readonly bars: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  /** Width of each part of the share bar, in % (all zero before a first game). */
  readonly share: readonly [number, number, number];
}

/** Results on one board size. */
export interface SectionView {
  readonly variant: string;
  /** The size's name, when the game has more than one. */
  readonly label: string | null;
  readonly rows: readonly LevelRowView[];
  readonly people: string;
  readonly form: readonly FormRow[];
}

/** A finished game in the list. */
export interface RecentView {
  readonly id: string;
  readonly result: string;
  readonly setup: string;
  readonly when: string;
  readonly moves: string;
}
