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

- `@fleet/ai`: `chooseMove(view, { level, seed })` reads only the computer's `FleetView`, never
  the full state: it places a fleet from the seed during `placing` (null once placed), fires when
  it is its turn, and is null otherwise. `Knowledge` derives what the view proves: cells fired at,
  water (misses, the rim of every sunk ship, the corners of every hit), open hits, ships afloat.
  - Beginner: anywhere not fired at; beside an open hit only half the time (`BEGINNER_FOLLOW_UP`).
  - Intermediate: extends a run of open hits, else tries beside a lone one, else hunts on the
    lattice spaced by the smallest ship afloat; never fires at known water.
  - Advanced: a density map of every placement of the ships afloat that avoids known water and
    wrecks (with open hits, only those through them, weighted 10^hits), firing at the maximum.
  - Specs: the fleet is legal and seeded; changing or hiding the rival fleet in the view changes no
    shot (fast-check); follows a hit, then the line; never fires at known water; legal games at
    every pairing; shots to sink 40 seeded fleets: 68.8 / 44.6 / 38.9 (random ≈ 95); intermediate
    beats beginner ≥ 15/20, advanced beats intermediate ≥ 11/20. A turn costs well under 1 ms.

Until the app plays it, `fleet` is in `ENGINE_ONLY` of `scripts/check-architecture.mjs` (an engine
folder outside the catalog); joining the catalog removes it from there.
