import type { Move } from '@dots/core';

/** A line of the board as the view draws it: its move, place and centre (percent of the grid). */
export interface LineSlot {
  readonly key: string;
  readonly move: Move;
  readonly left: number;
  readonly top: number;
  /** Centre, for arrow-key navigation. */
  readonly x: number;
  readonly y: number;
}
