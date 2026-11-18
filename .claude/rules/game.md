---
paths:
  - 'src/app/game/**'
---

# Executable rules · rulesVersion 1

Mini boards and their cells are numbered 0–8, row by row from the top-left corner, with the same
numbering on both levels. A move is `{ board, cell }`. X starts and players alternate. The piece
belongs to the player whose turn it is.

1. **Opening.** All nine mini boards are open. X may pick any of the 81 cells.
2. **Legality.** The game is in progress, both coordinates are integers in range, the mini board
   is open, it matches the forced target if there is one, and the cell is empty. A rejection
   keeps the position, the revision and the turn.
3. **Local resolution.** Place the piece and check the 8 lines (3 rows, 3 columns, 2 diagonals).
   Three of a player's pieces close the mini board for that player. Full with no line = drawn and
   closed. A win on the ninth cell beats the draw.
4. **Global resolution.** The same 8 lines over the mini board owners. Three in a row win
   immediately. A drawn board is neutral. All closed with no line = draw. There is **no**
   tie-break by counting boards.
5. **Target.** If the game goes on, the cell just played picks the next mini board. It is
   computed **after** local closing. If that board is won or drawn, the opponent may choose any
   open board.
6. **End.** A terminal position has no legal moves. A rematch creates another game with its own
   id.

## Reference scenarios (each needs a test)

| Situation                                             | Expected result                                               |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| X opens on board 4, cell 2                            | O may only play on board 2.                                   |
| O must play on 2 and picks cell 4                     | X plays on 4 if still open; X's earlier piece stays in place. |
| X closes board 2 by playing its cell 2                | O gets a free choice if the game goes on.                     |
| The chosen cell points to a drawn board               | All open boards are enabled; the drawn one stays closed.      |
| A move wins the third board of a global diagonal      | Immediate win even with empty cells left.                     |
| Zooming into a mini board and back to the global view | History, turn and score unchanged (UI, phase 2).              |

## Engine contract (`src/app/game/core/`)

- `initialState()`, `legalMoves(state)`, `applyMove(state, move)` returning a typed success or
  rejection, and `replay(moves, rulesVersion)`.
- Local states: open, won by X/O, drawn. Global states: in progress, X/O wins, draw.
- Explicit target: free, forced (with index) or game over.
- Deterministic and immutable. No Angular, network, clock, randomness, Worker or storage.
- Replaying the same moves with the same `rulesVersion` yields exactly the same position.

## Invariants (fast-check)

Each accepted move adds exactly one piece. A closed board never reopens. No history exceeds 81
moves. A rejection does not change the state. Record the seed and shrink path of every failure.

## Opponent (`src/app/game/ai/`)

Consumes `core` and always returns a legal move. Prepare a fallback move before searching. A
terminal global result outranks any local gain. Tests use a deterministic node limit; real runs
use a monotonic clock. Search budgets: 50 / 200 / 600 ms (beginner / intermediate / advanced).

A rules change requires a new `rulesVersion`, new fixtures and a decision on how games saved with
the previous version are read.

## Implementation map

| File              | Contents                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `core/types.ts`   | `GameState`, `Move`, statuses, `Target`, results, `RULES_VERSION`         |
| `core/lines.ts`   | The eight lines and `findLine`, shared by both levels                     |
| `core/resolve.ts` | `resolveBoard` (local) and `resolveGame` (global)                         |
| `core/engine.ts`  | `initialState`, `legalMoves`, `applyMove`; rejection order follows rule 2 |
| `core/replay.ts`  | `replay(moves, rulesVersion)`                                             |
| `core/index.ts`   | Public API; other layers import only from here                            |
| `core/testing/`   | Fixtures, `board.cell` notation and `formatState` (test-only)             |

Canonical fixtures (`core/testing/fixtures.ts`) were found by playing the engine itself; when one
changes, re-check the property its spec asserts. `example-game.spec.ts` snapshots a full game as
text so a reviewer can follow it without Angular. fast-check prints the seed and shrink path of a
failure; turn it into a fixed regression test before fixing.
