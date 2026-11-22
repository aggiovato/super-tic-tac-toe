---
paths:
  - 'src/app/games/dots/**'
---

# Dots and Boxes · rulesVersion 1 (first version)

A board of `size` × `size` boxes (3 or 5; the game's `variant` is the size as text, empty means 3)
and (size + 1)² dots. A move draws one line between neighbouring dots: `{ orientation: 'h' | 'v',
row, col }`, `h` from dot (row, col) to (row, col + 1), `v` from (row, col) to (row + 1, col). X
starts. Every box the line completes goes to the mover, who moves again (once, even for two boxes);
otherwise the turn passes. When every line is drawn the player with more boxes wins (a tie is a
draw, impossible on the odd boards of this version). Rejections, in order: `game-over`,
`invalid-coordinates`, `line-taken`; a rejection keeps the state. Longer lines and denser boards are
a later version (a new `rulesVersion`).

- `@dots/core`: `initialState(size)`, `legalMoves`, `applyMove` (also returns `closed`), `replay(moves,
rulesVersion, variant)`, `sizeOfVariant` / `variantOf`. Tested in Node with fast-check invariants.
- `@dots/ai`: `chooseMove(state, { level, seed, now? })`, budgets 50 / 200 / 600 ms. `Board` is a
  mutable copy with exact `draw` / `erase` for search.
  - Beginner: closes a box when it can, else any line (seeded).
  - Intermediate: also never draws a third side while a safe line is left; with none, gives the
    fewest boxes (`sacrificeCost`).
  - Advanced: plays like the intermediate while more than `EXACT_LINES` (15) lines are left and a
    safe one exists; otherwise solves the rest exactly (`solve`, memoised by the drawn lines: the
    double-cross and control of chains come out of it), keeping the intermediate's move if the
    deadline passes. The exact search visits 2^lines positions: 15 is ~125 ms in Node.
  - Specs: legal on both sizes, closes waiting boxes, gives nothing while safe lines exist, the
    advanced move is optimal in late positions against an independent engine oracle, and seeded
    games: intermediate beats beginner ≥ 16/20, advanced beats intermediate ≥ 7/10.
- `@dots/session`: `DotsSession` (start from the variant) and `DotsOpponent`, a `WorkerOpponent`
  from `@match` (`opponent.worker.ts`). `@dots/state`: `DotsStore` = `withMatch` + `boxes`, `size`,
  `lastLine`. Undo against the computer goes back to the person's last turn (`stepsToPerson`),
  however many moves; the opponent is asked again while it keeps the turn.
- `@dots/ui`: `/dots` and `/dots/history`. `DotsBoard` (pointer input on the whole platform resolves to the nearest free line, edge lines included; lines are native buttons with arrow-key
  roving focus, `dots-geometry.ts`), `DotsStatus` (the box score on the flap row, the waiting player dimmed; a sentence with the tally for screen readers), `DotsSettings`
  (how to play, board size; a new size starts a new series and asks again with a game under way),
  `DotsHowToPlay` (the shared `Ticket`). Player inks: `--color-player-x` / `--color-player-o`.
