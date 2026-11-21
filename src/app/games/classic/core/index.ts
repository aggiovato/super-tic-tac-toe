// Public API of the classic tic tac toe engine. Other layers import it as `@classic/core`.
export type { GameStatus, Line, Mark, Player } from '@tictac';
export { applyMove, initialState, legalMoves } from './engine';
export * from './models';
export { replay } from './replay';
