import type { ShipId } from '@fleet/core';

/** What a cell of a board shows: nothing known, water (shot or known), a hit, a ship and so on. */
export type CellState =
  | 'unknown'
  | 'water'
  /* known water: the rim of a sunk ship, where no ship can be */
  | 'rim'
  | 'hit'
  | 'sunk'
  | 'pending'
  /* one of this player's own ships, or a rival ship shown once the game is over */
  | 'ship'
  | 'shipHit';

/** One cell of a board as the grid draws it. */
export interface WaterCell {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  /** As players name it: `F4`. */
  readonly name: string;
  readonly state: CellState;
  /** Its accessible name. */
  readonly label: string;
  /** The last shot at this board landed here. */
  readonly last: boolean;
}

/** A ship drawn over the grid: a capsule (own ships) or an outline (sunk ships). */
export interface ShipOverlay {
  readonly ship: ShipId;
  readonly row: number;
  readonly col: number;
  readonly length: number;
  readonly orientation: 'h' | 'v';
  readonly selected?: boolean;
  /** A wreck just sunk, while the board is on screen: it sparks once. */
  readonly fresh?: boolean;
}
