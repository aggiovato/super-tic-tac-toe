/** One tile of the departure row. */
export interface FlapTile {
  readonly char: string;
  readonly accent: boolean;
  /** Most intermediate characters on the way to this one (longer for the result cascade). */
  readonly steps?: number;
}
