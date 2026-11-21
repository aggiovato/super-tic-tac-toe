import type { Mark } from '@tictac';

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
