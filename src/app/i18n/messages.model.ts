import type { RejectionReason } from '@core';

export type Lang = 'es' | 'en';

/**
 * Every user-facing string. Both languages implement the whole interface. Board and cell numbers
 * arrive as shown to players (1–9); `who` is a player's name or symbol.
 */
export interface Messages {
  readonly langName: string;
  /** Words for the flap row: `free` and `wins` take 5 tiles, `draw` the whole row of 7. */
  readonly flap: { readonly free: string; readonly wins: string; readonly draw: string };
  readonly departureLabel: string;
  readonly opening: string;
  readonly forced: (mover: string, cell: number, next: string) => string;
  readonly freeChoice: (mover: string, cell: number, next: string) => string;
  readonly preview: (next: string, board: number | null) => string;
  readonly rejected: (reason: RejectionReason, board: number | null) => string;
  readonly won: (winner: string) => string;
  readonly drawn: string;
  readonly status: {
    readonly forced: (next: string, board: number) => string;
    readonly free: (next: string) => string;
    readonly won: (winner: string) => string;
    readonly drawn: string;
  };
  readonly boardLabel: string;
  readonly board: (board: number) => string;
  readonly openBoard: (board: number) => string;
  readonly cell: (board: number, cell: number, mark: string | null) => string;
  readonly closedWon: (board: number, winner: string) => string;
  readonly closedDrawn: (board: number) => string;
  readonly showAll: string;
  readonly defaultName: (index: number) => string;
  /** How the computer player is named in sentences and the score. */
  readonly opponent: string;
  readonly draws: string;
  readonly score: string;
  readonly rematch: string;
  readonly undo: string;
  /** The how-to-play ticket: four rules, each beside a small board drawing, and a closing tip. */
  readonly howToPlay: {
    readonly title: string;
    readonly intro: string;
    /** Winning one small board, and a full board with no line. */
    readonly board: string;
    /** The cell you play sends the opponent to the board in that same position. */
    readonly destination: string;
    /** Where you may play: the board in Apricot, or any open one when sent to a closed board. */
    readonly target: string;
    /** Winning the game: three boards in a line. */
    readonly win: string;
    /** The flap row says whose turn it is and where. */
    readonly guide: string;
    readonly play: string;
    readonly skip: string;
  };
  readonly settings: {
    readonly open: string;
    readonly title: string;
    readonly close: string;
    readonly mode: string;
    readonly modes: { readonly humans: string; readonly opponent: string };
    readonly level: string;
    readonly levels: {
      readonly beginner: string;
      readonly intermediate: string;
      readonly advanced: string;
    };
    readonly players: string;
    readonly playerName: (index: number) => string;
    readonly language: string;
    readonly motion: string;
    readonly motionSystem: string;
    readonly motionFull: string;
    readonly motionReduced: string;
    readonly autoZoom: string;
    readonly autoZoomHint: string;
    readonly hints: string;
    readonly hintsHint: string;
    readonly design: string;
    readonly designs: { readonly departures: string; readonly 'departures-contrast': string };
    readonly newSeries: string;
    readonly confirmNewSeries: string;
    /** Second press that applies a new mode or level and clears the score. */
    readonly confirmModeChange: string;
    /** Reopens the how-to-play ticket. */
    readonly howToPlay: string;
    /** The tab list's accessible name. */
    readonly sections: string;
    readonly sectionNames: { readonly game: string; readonly app: string };
  };
}
