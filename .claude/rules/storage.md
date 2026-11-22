---
paths:
  - 'src/app/core/storage/**'
  - 'src/app/core/match/**'
  - 'src/app/features/history/**'
  - 'src/app/layout/save-notice/**'
---

# Saving and history (phase 4)

- **Records** (`@storage`, IndexedDB database `super-3t`, version 1): `series` keyed by game
  (`gameId`, `seriesId`, `currentGameId`, `wins`, `draws`, `version`) and `games` keyed by id
  (`gameId`, `schemaVersion`, `rulesVersion`, optional `variant` (a board size), `seriesId`,
  `seats`, `seed`, `xPlayer`, `moves`, `revision`, `result` by participant, `startedAt`,
  `updatedAt`, `finishedAt`). The `finished` index (`[gameId, finishedAt]`) holds finished games
  only. A change of shape bumps `SCHEMA_VERSION` and needs a migration; a record that cannot be
  read is kept and a new game starts.
- **Seats** (schema 2): `seats` is who played participant 0 and 1, as it was then: `kind`
  (`local` a person on this device, `computer` with its `level`, `remote` reserved for online),
  the `name` a person chose and, later, a `playerId` (accounts). `seatsOf(mode, level, names)`
  writes them; `sideOf(record)` reads the mode and level back. Schema 1 kept `mode`
  (`'humans' | 'opponent'`) and `level` instead: `readGameRecord` (`record-schema.ts`) turns those
  into seats whenever a repository reads a record, so stored games are never rewritten just to
  migrate them; the next save writes schema 2. Preferences read the old mode names the same way.
- **Saving** (`matchStorage` in `@match`, on routes with `provideMatchStorage(gameId)`): after the
  restore, an effect saves every change in order, the series and its current game in one
  transaction. The series' `version` is checked inside it: a save that lost a race with another tab
  stops saving (`conflict`, the page offers Reload); `quota`, `failed` and `unavailable` are shown
  and the first two can be retried. Without IndexedDB the app uses `MemoryRepository` and says the
  game will not be kept.
- **Cleanup**: a save may name a `drop` id, deleted in the same transaction unless that game
  finished: the game this tab last saved or restored, when the series moved on and left it
  unfinished. An unreadable record is never dropped, and a missing current game keeps the series'
  version, so the next save builds on it instead of a false conflict.
- **Restoring**: the board takes no moves until the saved match is back (`ready`). The moves are
  replayed with the engine (a throw counts as unreadable); the player's commands are ignored
  until then; if it is the opponent's turn, one request is made. The mode and level
  come back from the record and are written to the preferences.
- **One result per game**: the result is part of the record and `scored` comes back with it, so a
  reload, reopening the final screen or a rematch never counts a game twice; a rematch is a new id
  in the same series, a new series or mode a new series id.
- **History** (`HistoryPage`, `/<game>/history`): results against the computer by level for the
  person (participant 0), the number of games for two people and the ten latest finished games.
- Tests: `classic-store.spec.ts` (app, `MemoryRepository`, one injector per tab) and the
  "saving and resuming" e2e, which use the browser's real IndexedDB.
