import type { GameId } from '@catalog';
import type { PlayMode } from '@preferences';
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
  /** The computer opponent's name at each level: trains, slowest to fastest. */
  readonly opponents: {
    readonly beginner: string;
    readonly intermediate: string;
    readonly advanced: string;
  };
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
  /** A new version of the installed app, downloaded and ready. */
  readonly update: {
    readonly available: string;
    readonly apply: string;
    /** The game could not be saved: updating now would lose its last moves. */
    readonly unsaved: string;
    readonly applyAnyway: string;
    /** While the game's last save finishes before the reload. */
    readonly applying: string;
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
    /** A board size's name, from its variant ('3' → 3×3). */
    readonly board: (variant: string) => string;
  };
  /** The Dots and Boxes screen. */
  readonly dots: {
    /** Flap word after the player and the arrow while the game goes on (five letters). */
    readonly flapTurn: string;
    readonly opening: string;
    readonly drew: (mover: string, next: string) => string;
    readonly closed: (mover: string, boxes: number) => string;
    readonly won: (winner: string, theirs: number, others: number) => string;
    readonly drawn: string;
    readonly rejected: (reason: 'game-over' | 'invalid-coordinates' | 'line-taken') => string;
    readonly status: {
      readonly turn: (next: string) => string;
      readonly won: (winner: string) => string;
      readonly drawn: string;
    };
    /** The boxes each player holds in the game on the board, for screen readers. */
    readonly tallyStatus: (x: number, o: number) => string;
    readonly board: string;
    /** A line's accessible name: rows and columns of dots counted from 1. */
    readonly line: (
      orientation: 'h' | 'v',
      row: number,
      col: number,
      owner: string | null,
    ) => string;
    readonly size: string;
    readonly sizeName: (boxes: number) => string;
    readonly confirmSize: string;
    readonly howToPlay: {
      readonly title: string;
      readonly intro: string;
      readonly draw: string;
      readonly close: string;
      readonly careful: string;
      readonly win: string;
    };
  };
  /** Each game's name, in the game library. */
  readonly games: Readonly<Record<GameId, string>>;
  /** Online play by invitation: a private room and its link. */
  readonly online: {
    readonly title: string;
    readonly invite: string;
    readonly inviteHint: string;
    readonly creating: string;
    readonly createFailed: string;
    /** This device's player, when no name was typed. */
    readonly you: string;
    readonly rival: string;
    readonly waiting: string;
    readonly waitingHint: string;
    readonly link: string;
    readonly share: string;
    readonly copy: string;
    readonly copied: string;
    readonly shareText: (game: string) => string;
    readonly connecting: string;
    readonly reconnecting: string;
    readonly rivalAway: string;
    readonly connected: string;
    readonly leave: string;
    readonly retry: string;
    readonly playHere: string;
    /** Why this device cannot play in the room. */
    readonly problems: Readonly<Record<'missing' | 'full' | 'expired' | 'unreachable', string>>;
  };
  /** The library of games: the aside on wide screens, the games dialog elsewhere. */
  readonly library: {
    readonly open: string;
    readonly title: string;
    readonly close: string;
    /** Folds the aside to a rail and unfolds it again (wide screens). */
    readonly hide: string;
    readonly show: string;
    /** The badge on the game on screen. */
    readonly playing: string;
    /** One line per game; a game added to the catalog needs one in every language. */
    readonly blurbs: Readonly<Record<GameId, string>>;
  };
  readonly settings: {
    readonly open: string;
    readonly title: string;
    readonly close: string;
    readonly mode: string;
    readonly modes: Readonly<Record<PlayMode, string>>;
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
    /** The tab list's accessible name. */
    readonly sections: string;
    readonly sectionNames: { readonly game: string; readonly app: string };
  };
}
