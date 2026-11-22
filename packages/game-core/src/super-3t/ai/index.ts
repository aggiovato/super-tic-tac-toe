// Public API of the opponent. Plain TypeScript: other layers import it as `@ai`.
export type { Level, ComputerOptions } from './models';
export { chooseMove } from './computer';
export { defend, keyMoves, refutations } from './forcing';
