import type { ComputerLevel } from '@catalog';
import type { Outcome } from '../history-ticket/history.model';

/** One level's row on the form chart, already in words. */
export interface FormRow {
  readonly level: ComputerLevel;
  readonly name: string;
  /** The level as rising bars (1–3). */
  readonly bars: number;
  /** Its latest games, oldest first. */
  readonly form: readonly Outcome[];
  /** The row as one sentence for screen readers. */
  readonly label: string;
}
