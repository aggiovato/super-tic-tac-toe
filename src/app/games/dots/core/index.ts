// Public API of the Dots and Boxes engine. Other layers import it as `@dots/core`.
export type { Player } from '@tictac';
export {
  applyMove,
  boxesBeside,
  initialState,
  legalMoves,
  lineIndex,
  sameMove,
  sizeOf,
} from './engine';
export * from './models';
export { replay } from './replay';
export { sizeOfVariant, variantOf } from './variant';
