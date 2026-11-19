export type MotionSetting = 'system' | 'full' | 'reduced';
export type Design = 'departures' | 'departures-contrast';
/** Two people on one device, or a person against the computer. */
export type PlayMode = 'humans' | 'opponent';
/** Opponent levels the app offers: the three of `@ai`, weakest first. */
export type OpponentLevel = 'beginner' | 'intermediate' | 'advanced';

export interface PreferencesState {
  /** Custom names for the two participants; empty means the default "Player 1/2". */
  readonly names: readonly [string, string];
  readonly motion: MotionSetting;
  /** Narrow screens: open the forced board automatically after each move. */
  readonly autoZoom: boolean;
  /** Cell numbers and the departure preview on hover and focus. */
  readonly hints: boolean;
  readonly design: Design;
  readonly mode: PlayMode;
  readonly level: OpponentLevel;
}
