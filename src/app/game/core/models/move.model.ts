/** A move places the current player's piece on `cell` of mini board `board`, both 0–8. */
export interface Move {
  readonly board: number;
  readonly cell: number;
}
