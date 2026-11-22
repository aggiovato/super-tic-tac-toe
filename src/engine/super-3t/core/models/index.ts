// The shared tic tac toe types, re-exported so Super 3T's layers import one block.
export type { BoardStatus, GameStatus, Line, Mark, Player } from '@tictac';
export { RULES_VERSION, type GameState, type RulesVersion } from './game-state.model';
export type { MoveResult, RejectionReason } from './move-result.model';
export type { Move } from './move.model';
export type { ReplayResult } from './replay-result.model';
export type { Target } from './target.model';
