---
paths:
  - 'src/app/storage/**'
  - 'src/app/match/**'
  - 'src/app/shell/history-page/**'
  - 'src/app/shell/save-notice/**'
---

# Saving and history (phase 4)

- **Records** (`@storage`, IndexedDB database `super-3t`, version 1): `series` keyed by game
  (`gameId`, `seriesId`, `currentGameId`, `wins`, `draws`, `version`) and `games` keyed by id
  (`gameId`, `schemaVersion`, `rulesVersion`, `seriesId`, `mode`, `level`, `seed`, `xPlayer`,
  `moves`, `revision`, `result` by participant, `startedAt`, `updatedAt`, `finishedAt`). The
  `finished` index (`[gameId, finishedAt]`) holds finished games only. A change of shape bumps
  `SCHEMA_VERSION` and needs a migration; a record that cannot be read is kept and a new game starts.
- **Saving** (`matchStorage` in `@match`, on routes with `provideMatchStorage(gameId)`): after the
  restore, an effect saves every change in order, the series and its current game in one
  transaction. The series' `version` is checked inside it: a save that lost a race with another tab
  stops saving (`conflict`, the page offers Reload); `quota`, `failed` and `unavailable` are shown
  and the first two can be retried. Without IndexedDB the app uses `MemoryRepository` and says the
  game will not be kept.
- **Restoring**: the board takes no moves until the saved match is back (`ready`). The moves are
  replayed with the engine; if it is the opponent's turn, one request is made. The mode and level
  come back from the record and are written to the preferences.
- **One result per game**: the result is part of the record and `scored` comes back with it, so a
  reload, reopening the final screen or a rematch never counts a game twice; a rematch is a new id
  in the same series, a new series or mode a new series id.
- **History** (`HistoryPage`, `/<game>/history`): results against the computer by level for the
  person (participant 0), the number of games for two people and the ten latest finished games.
- Tests: `classic-store.spec.ts` (app, `MemoryRepository`, one injector per tab) and the
  "saving and resuming" e2e, which use the browser's real IndexedDB.
