// Public API of the Ship Sink engine. Other layers import it as `@fleet/core`.
export type { Player } from '@tictac';
export {
  applyMove,
  fired,
  initialState,
  legalMoves,
  mayMove,
  other,
  resolveShot,
  sameMove,
  statusOf,
} from './engine';
export {
  allPlacements,
  cellIndex,
  fleetProblem,
  normalizeFleet,
  randomFleet,
  sameFleet,
  shipAt,
  shipCells,
  shipRim,
} from './fleet';
export * from './models';
export { replay } from './replay';
export {
  redactMoves,
  replayView,
  viewOf,
  type FleetView,
  type ViewMove,
  type ViewReplayResult,
} from './view';
