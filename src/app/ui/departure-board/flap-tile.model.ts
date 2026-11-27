/** One tile of the departure row. */
export interface FlapTile {
  readonly char: string;
  readonly accent: boolean;
  /** Most intermediate characters on the way to this one (longer for the result cascade). */
  readonly steps?: number;
  /** A player's ink (games that colour each player), or a Ship Sink hit's, instead of the text's. */
  readonly ink?: 'x' | 'o' | 'hit';
  /** Stepped back (the player who waits), so the other side of the row reads first. */
  readonly dim?: boolean;
  /** Changing it replays the tile from blank, even onto the same character (a box closed). */
  readonly spin?: number;
}
