import type { Player, Shot } from '@fleet/core';

/** The last shot fired in the game on the board, and who fired it. */
export interface LastShot {
  readonly by: Player;
  readonly shot: Shot;
}
