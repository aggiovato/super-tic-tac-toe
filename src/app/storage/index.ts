// Public API of the device storage: games and their series, kept in IndexedDB.
export { GameRepository, type StoredMatch, type StoredSeries } from './game-repository';
export { IndexedDbRepository } from './indexed-db-repository';
export { MemoryRepository } from './memory-repository';
export { provideGameRepository } from './provide-repository';
export { readGameRecord, seatsOf, sideOf } from './record-schema';
export {
  type GameRecord,
  type GameResult,
  SaveError,
  type SaveFailure,
  SCHEMA_VERSION,
  type Seat,
  type SeatKind,
  type SeriesRecord,
} from './records.model';
