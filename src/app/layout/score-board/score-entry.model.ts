/** One column of the series score. */
export interface ScoreEntry {
  readonly label: string;
  /** Flap glyph of the player's symbol; null for the draws column. */
  readonly glyph: string | null;
  readonly digits: readonly string[];
  /** The computer's level as bars, beside its name; null for people and the draws. */
  readonly bars: number | null;
  /** The level in words, for screen readers (the bars are decorative). */
  readonly levelName: string | null;
  /** The player to move. */
  readonly active: boolean;
  /** Whose turn it is, on the tag under the score: shown only on the player to move. */
  readonly turn: string | null;
}
