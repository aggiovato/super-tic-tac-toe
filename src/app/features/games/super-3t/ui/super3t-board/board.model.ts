import type { GameState, Move } from '@super3t/core';
import type { Messages } from '@i18n';

/** How the board is played right now. */
export type BoardMode =
  /** Wide layout: every cell is a button. */
  | 'direct'
  /** Narrow layout, global view: pick a board to open. */
  | 'pick'
  /** Narrow layout, one board open with a thumbnail of the whole game. */
  | 'zoom';

/** What the platforms are drawn from: the game and how it is shown now. */
export interface PlatformInput {
  readonly game: GameState;
  readonly t: Messages;
  readonly mode: BoardMode;
  /** Legal moves as `board * 9 + cell`. */
  readonly legal: ReadonlySet<number>;
  readonly last: Move | null | undefined;
  readonly playable: ReadonlySet<number>;
  readonly previewTarget: number | null | undefined;
  /** The board the last move closed, until it has been seen. */
  readonly freshBoard: number | null;
  readonly motion: boolean;
}
