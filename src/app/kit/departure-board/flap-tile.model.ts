/** One tile of the departure row. */
export interface FlapTile {
  readonly char: string;
  readonly accent: boolean;
  /** Most intermediate characters on the way to this one (longer for the result cascade). */
  readonly steps?: number;
  /** A player's ink instead of the default text colour (games that colour each player). */
  readonly ink?: 'x' | 'o';
  /** Stepped back (the player who waits), so the other side of the row reads first. */
  readonly dim?: boolean;
}
