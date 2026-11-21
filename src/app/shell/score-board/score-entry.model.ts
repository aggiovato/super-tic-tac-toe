/** One column of the series score. */
export interface ScoreEntry {
  readonly label: string;
  /** Flap glyph of the player's symbol; null for the draws column. */
  readonly glyph: string | null;
  readonly digits: readonly string[];
  /** The player to move. */
  readonly active: boolean;
}
