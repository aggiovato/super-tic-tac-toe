// Shared by the tic tac toe family: players, the eight lines of a 3×3 grid, how a grid closes, and
// the seeded random picks and cell preferences opponents use.
// Plain TypeScript, imported by every game as `@tictac`; it never imports a game.
export { findLine, LINES } from './lines';
export * from './models';
export { createRandom, pickWeighted, turnSeed, type Random } from './random';
export { resolveBoard } from './resolve';
export { cellWeight } from './weights';
