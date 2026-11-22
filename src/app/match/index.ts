// Public API of a match: what every turn-based game of the app shares at runtime (Angular).
export { GameSession } from './game-session';
export type {
  Level,
  MatchApi,
  MatchGame,
  MatchResult,
  GameRules,
  MatchState,
  Mode,
  ComputerRequest,
  Participant,
  SaveStatus,
} from './match.model';
export { LocalComputer, COMPUTER_PACE_MS } from './local-computer';
export { MATCH_STORAGE, provideMatchStorage } from './match-storage';
export { ComputerPlayer } from './computer';
export { withMatch } from './with-match';
export {
  type ComputerReplyMessage,
  type ComputerRequestMessage,
  WorkerComputer,
} from './worker-computer';
export { ACTIVE_GAME, provideActiveGame, type ActiveGame } from './active-game';
