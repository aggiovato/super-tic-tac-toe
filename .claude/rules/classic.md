---
paths:
  - 'src/engine/classic/**'
  - 'src/app/features/games/classic/**'
---

# Classic tic tac toe · rulesVersion 1

One 3×3 board, cells 0–8 row by row; a move is `{ cell }`. X starts, players alternate. A line wins
at once, a full board with no line is a draw, a line on the ninth cell wins. Rejections, in order:
`game-over`, `invalid-coordinates`, `cell-occupied`; a rejection keeps the state.

- `@classic/core`: `initialState`, `legalMoves`, `applyMove`, `replay`, built on `@tictac`'s
  `resolveBoard`. Tested in Node, with fast-check invariants.
- `@classic/ai`: `chooseMove(state, { level, seed })`. Beginner wins in one move when it can, else a
  weighted random move; intermediate also blocks; advanced is a memoised negamax (`bestMoves`) and
  never loses, picking among equally good moves by the seed. The spec plays every sequence of the
  other side against it.
- `@classic/session`: `ClassicSession` and `ClassicComputer` (a `LocalComputer` from `@match`, main
  thread, `COMPUTER_PACE_MS`). `@classic/state`: `ClassicStore` is `withMatch` alone.
- `@classic/ui`: `/classic`, the shared `GameLayout`, `ClassicStatus` and `ClassicBoard` (`@ui` cells,
  strike line, arrow-key roving focus). Mode and level are `Preferences.play().classic`.
