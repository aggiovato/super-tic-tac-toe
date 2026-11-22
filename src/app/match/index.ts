// Public API of a match: what every turn-based game of the app shares at runtime (Angular).
export { GameSession } from './game-session';
export type {
  Level,
  MatchApi,
  MatchGame,
  MatchResult,
  MatchRules,
  MatchState,
  Mode,
  OpponentRequest,
  Participant,
  SaveStatus,
} from './match.model';
export { LocalOpponent, OPPONENT_PACE_MS } from './local-opponent';
export { MATCH_STORAGE, provideMatchStorage } from './match-storage';
export { Opponent } from './opponent';
export { withMatch } from './with-match';
