---
paths:
  - 'packages/game-core/src/fleet/**'
  - 'src/app/features/games/fleet/**'
---

# Ship Sink · rulesVersion 1 (first version)

Shown as "Ship Sink" (mark SS); id, folder and alias prefix `fleet`. A game of hidden information:
it is played against the computer or online, never by two people on one device.

A 10×10 board per player, rows A–J (`row` 0–9) and columns 1–10 (`col` 0–9). The fleet is
`SHIP_IDS`, largest first: carrier 5, battleship 4, cruiser 3, submarine 3, destroyer 2 (17 cells).
A ship lies from its bow (top or left cell) `h` (rightwards) or `v` (downwards); ships never touch,
not even corner to corner. One shape for now (`variant` `''`).

- Moves: `{ kind: 'place', player, fleet }` (each player once, in any order, before any shot; the
  move names its player because both place at once) and `{ kind: 'shot', row, col }`, fired by
  `turn`. X fires first. Water passes the turn; a hit or a sinking shot fires again; sinking the
  fifth ship wins. No draws. A player may fire at a cell once (the rival's waters are theirs to
  track, so the rim of a sunk ship is still a legal, if wasted, shot).
- Rejections, in order: `game-over`; for a placement `already-placed` (that player placed, or the
  firing began), `invalid-fleet` (`fleetProblem`: `composition`, `out-of-bounds`, `overlap`,
  `touching`); for a shot `placing`, `invalid-coordinates`, `already-shot`. A rejection keeps the
  state. The engine stores a fleet normalised to `SHIP_IDS` order.
- `phase` is `placing` → `firing` → `over`. During `placing`, `legalMoves` is empty and `mayMove`
  is true for each player still to place; afterwards only for `turn`.
- Hidden information: `viewOf(state, viewer)` is what one player knows (their fleet; the rival's
  only once over; every shot with its outcome; a sinking shot carries the sunk ship's placement).
  `redactMoves` is the log the server may send a seat; `replayView(moves, rulesVersion, viewer)`
  rebuilds the same view without the rival fleet. Properties: the view rebuilt from the redacted
  log equals the full game's view, and before the end no redacted log locates a rival ship that
  still floats.
- `randomFleet(random)` places a legal fleet (the computer's, and the player's quick placement);
  the same seed gives the same fleet.
- Fixtures (`@fleet/core/testing`): cells as players name them (`'F4'`), fleets as five bows in
  `SHIP_IDS` order (`'A1h C1v C3h G5v J8h'`), `play(fleets, 'F4 F5')` places both fleets and fires
  each shot for whoever is to fire, failing on the first refusal.

Until the app plays it, `fleet` is in `ENGINE_ONLY` of `scripts/check-architecture.mjs` (an engine
folder outside the catalog); joining the catalog removes it from there.
