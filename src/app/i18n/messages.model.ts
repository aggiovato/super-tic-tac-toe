import type { RejectionReason } from '@super3t/core';

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
    /** A link to the tactical challenges. */
    readonly practise: string;
    readonly play: string;
    readonly skip: string;
  };
  /** The tactical challenge screen. */
  readonly challenge: {
    readonly title: string;
    /** The picker's legend and each level's name. */
    readonly picker: string;
    readonly levels: { readonly easy: string; readonly medium: string; readonly hard: string };
    /** Appended to a solved challenge's name in the picker. */
    readonly solvedMark: string;
    readonly goal: string;
    readonly findKey: string;
    readonly defending: string;
    readonly finish: string;
    /** A wrong key move: where the defender would hold out (board and cell, 1–9). */
    readonly saved: (board: number, cell: number) => string;
    readonly missed: string;
    readonly solved: string;
    readonly retry: string;
    readonly next: string;
    readonly exit: string;
  };
  /** The classic tic tac toe screen. */
  readonly classic: {
    /** Flap word after the player and the arrow while the game goes on (five letters). */
    readonly flapTurn: string;
    readonly opening: string;
    readonly played: (mover: string, cell: number, next: string) => string;
    readonly won: (winner: string) => string;
    readonly drawn: string;
    readonly rejected: (reason: 'game-over' | 'invalid-coordinates' | 'cell-occupied') => string;
    readonly status: {
      readonly turn: (next: string) => string;
      readonly won: (winner: string) => string;
      readonly drawn: string;
    };
    readonly board: string;
    readonly cell: (cell: number, mark: string | null) => string;
  };
  /** Saving the game on this device. */
  readonly save: {
    readonly saving: string;
    readonly saved: string;
    readonly quota: string;
    readonly failed: string;
    readonly unavailable: string;
    readonly conflict: string;
    readonly retry: string;
    readonly reload: string;
  };
  /** The history of a game: results against the computer by level and the latest games. */
  readonly history: {
    readonly open: string;
    readonly title: (game: string) => string;
    readonly back: string;
    readonly byLevel: string;
    readonly level: string;
    readonly wins: string;
    readonly draws: string;
    readonly losses: string;
    readonly humans: (count: number) => string;
    readonly recent: string;
    readonly empty: (game: string) => string;
    readonly won: string;
    readonly lost: string;
    readonly draw: string;
    readonly winner: (name: string) => string;
    readonly moves: (count: number) => string;
  };
  /** Each game's name, in the game switcher. */
  readonly games: { readonly 'super-3t': string; readonly classic: string };
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
    readonly challenges: string;
    /** The game switcher's legend. */
    readonly game: string;
    /** The tab list's accessible name. */
    readonly sections: string;
    readonly sectionNames: { readonly game: string; readonly app: string };
  };
}
