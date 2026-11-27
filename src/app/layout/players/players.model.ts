/** How a game marks its players beside their names. */
export type PlayerMarks = 'symbol' | 'ink' | 'none';

/**
 * A game's own live figure for each player, shown on their card above the series (Dots and Boxes:
 * the boxes each holds), by participant.
 */
export interface PlayerStat {
  /** What the figure counts, for screen readers ("boxes"). */
  readonly label: string;
  readonly values: readonly [number, number];
  /** Changing a participant's spin replays their figure from blank (a box just closed). */
  readonly spins?: readonly [number, number];
}

/** One card of the players: who they are, the game's figure, their series wins, their turn. */
export interface PlayerCard {
  readonly label: string;
  /** Flap glyph of the player's symbol; null without marks and for the draws. */
  readonly glyph: string | null;
  /** The player's ink (games that colour each player); null otherwise. */
  readonly ink: 'x' | 'o' | null;
  /** The game's live figure, when it has one; null for the draws. */
  readonly stat: { readonly digits: readonly string[]; readonly spin: number } | null;
  readonly digits: readonly string[];
  /** The computer's level as bars, beside its name; null for people and the draws. */
  readonly bars: number | null;
  /** The level in words, for screen readers (the bars are decorative). */
  readonly levelName: string | null;
  /** The player to move. */
  readonly active: boolean;
  /** Whose turn it is, on the tag under the card: shown only on the player to move. */
  readonly turn: string | null;
  /** The draws, between the two players (only in games that can end drawn). */
  readonly draws: boolean;
}
