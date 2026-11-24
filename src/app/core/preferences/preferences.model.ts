import type { ComputerLevel, GameId, PlayMode } from '@catalog';

export type { PlayMode };

export type MotionSetting = 'system' | 'full' | 'reduced';
export type Design = 'departures' | 'departures-contrast';

/** Who plays a game: two people, or a person against the computer at a level. */
export interface PlaySetup {
  readonly mode: PlayMode;
  readonly level: ComputerLevel;
  /** The game's variant (a board size), for games that have more than one. */
  readonly variant?: string;
}

export interface PreferencesState {
  /** Custom names for the two participants; empty means the default "Player 1/2". */
  readonly names: readonly [string, string];
  readonly motion: MotionSetting;
  /** Narrow screens: open the forced board automatically after each move. */
  readonly autoZoom: boolean;
  /** Cell numbers and the departure preview on hover and focus. */
  readonly hints: boolean;
  /** Wide screens: the library of games shown beside the game (else folded to a rail). */
  readonly libraryShown: boolean;
  readonly design: Design;
  /** Mode and level per game. */
  readonly play: Readonly<Record<GameId, PlaySetup>>;
  /** The game the app opens on: the last one played. */
  readonly lastGame: GameId;
  /** Games whose how-to-play ticket was shown once (first visit); Settings reopens it on demand. */
  readonly seenTutorials: readonly GameId[];
  /** Ids of Super 3T's tactical challenges solved at least once; each counts a single time. */
  readonly solvedChallenges: readonly string[];
}
