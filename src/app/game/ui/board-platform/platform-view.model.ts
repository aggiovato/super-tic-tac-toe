import type { Mark } from '@core';
import type { Segment } from '@kit';

/** Everything a cell shows, derived once per change instead of computed from the template. */
export interface CellView {
  readonly cell: number;
  readonly mark: Mark;
  /** Flap character: `x`, `o` or blank. */
  readonly glyph: string;
  readonly legal: boolean;
  readonly last: boolean;
  readonly label: string;
  /** Its value in the board's roving keyboard navigation. */
  readonly roving: number;
}

/** Everything one platform (mini board) shows. */
export interface PlatformView {
  readonly board: number;
  /** As shown to players, 1–9. */
  readonly number: string;
  readonly label: string;
  readonly forced: boolean;
  readonly freePick: boolean;
  readonly playable: boolean;
  readonly closed: boolean;
  readonly preview: boolean;
  readonly win: boolean;
  /** Replays the number flap each time the board becomes the forced destination. */
  readonly spin: number;
  readonly closing: 'X' | 'O' | '=' | null;
  /** Closed by the last move and not yet seen: its large mark and line draw on, once. */
  readonly fresh: boolean;
  /** Fresh and motion allowed: the card flashes and shakes as it closes. */
  readonly spark: boolean;
  /** One of the three boards that won the game, motion allowed: it flashes three times. */
  readonly winSpark: boolean;
  readonly strike: Segment | null;
  readonly cells: readonly CellView[];
}
