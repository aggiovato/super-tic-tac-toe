// Public API of the opponent. Plain TypeScript: other layers import it as `@ai`.
export type { Level, OpponentOptions } from './models';
export { chooseMove } from './opponent';
export { defend, keyMoves, refutations } from './forcing';
