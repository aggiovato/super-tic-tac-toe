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

Levels are built one at a time, weakest first; `Level` lists only the ones that exist, and an
unknown level is refused. The beginner is the one exception to "a terminal global result outranks
any local gain": it never looks at the reply its move allows, so it may win a board that hands the
opponent the game. Seeing that is what the intermediate level adds.

| File                 | Contents                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `ai/opponent.ts`     | `chooseMove(state, { level, seed, now? })`: fallback first, then the level within `BUDGET_MS`   |
| `ai/beginner.ts`     | Wins the game, else a board, in one move; else a weighted random legal move                     |
| `ai/intermediate.ts` | Wins the game; never hands it over while a safe move is left; scores the rest (see `SCORE`)     |
| `ai/advanced.ts`     | Negamax with alpha-beta, move ordering and iterative deepening; keeps the last complete round   |
| `ai/evaluation.ts`   | `evaluate`: boards won by place, global threats, local threats (more on decisive boards); `WIN` |
| `ai/tactics.ts`      | `outcomes` (each legal move applied once) and `winningMoves` (game and board wins)              |
| `ai/threats.ts`      | `completions` on either level: `cellThreats` (a board) and `boardThreats` (the game)            |
| `ai/random.ts`       | `createRandom` (mulberry32), `turnSeed` (game seed × revision), `pickWeighted`                  |
| `ai/weights.ts`      | `cellWeight`: centre, corners, edges; every level's random picks and tie-breaks                 |
| `ai/models/`         | `Level`, `OpponentOptions`, `MoveOutcome`, `SearchLimits` (fallback and `expired`)              |
| `ai/testing/`        | Positions found by seeded games (`LONG_GAME` and cuts of it); test-only, internal to `ai`       |

`chooseMove` prepares a legal fallback (a weighted random move, no engine work) and gives the level
a deadline on a monotonic clock (`now`, `performance.now` by default). Tests freeze the clock, or
spend it on purpose; budgets are checked by counting engine calls. The intermediate level looks one
reply ahead (each legal move, then each reply once: the budget spec counts it) and, out of time,
plays the best move scored so far or the fallback. It scores board wins, global threats, taking a
board the opponent needs, blocking the opponent's only winning cell on a board (more if that board
wins them the game; with two, a block is idle and earns nothing), and penalises sending the
opponent to a board it can win or to a free choice. Over 40 seeded games against the beginner it must win at least 30 and
lose at most 3 (it wins 36, draws 4).

The advanced level searches one ply deeper per round within 600 ms and keeps the best move of the
last round it completed (a round cut short is discarded; with none complete it plays the fallback).
It stops deepening once a round is certain: a won or lost line, or no line reached the depth limit
(a deeper round would search the same tree); depth is capped by the cells still playable. A node
reads the clock before ordering its moves and before each move it applies, so a clock allowing N
readings bounds the engine calls to N − 1 (one reading sets the deadline): tests use it instead of
time. It orders the previous best first, then cells that win a board, then blocks, then centre,
corners and edges, with a seeded jitter at the root. The leaf evaluator is injectable (`Evaluator`)
to compare evaluations in offline batches; a side-to-move tempo bonus was tried that way and did not
help (24 games at 1500 and 4000 nodes, within noise), so it is not used. About 170k nodes per
second in Node; in the browser a reply takes ~850 ms from the click (600 ms of search), and a
settled endgame answers in milliseconds. With 2000 readings it must beat the intermediate in at
least 7 of 10 seeded games (it wins 9, draws 1).

Playing it (`@session`, `@state`): `Opponent` (`reply`, `cancel`) is provided on the game route as
`WorkerOpponent`, a module Worker (`session/opponent.worker.ts`, built with `tsconfig.worker.json`)
that replays the moves and calls `chooseMove`; no reply shows before `OPPONENT_PACE_MS` (450 ms),
and cancelling a busy Worker terminates it. `GameStore` asks after each move of the person (and
when the opponent opens as X) and only acts on the reply to its latest request: every request,
undo, new game and leaving the route moves a ticket on, so a cancelled reply (null) or one asked
before an undo and replay reached the same revision is dropped. It revalidates every reply with
the engine and plays the first legal move if it is illegal or the opponent fails; a Worker that
fails is dropped and the next request starts a fresh one. Changing mode or level with a score or a
game under way asks for a second press, like "New series".
Against the computer participant 1 is the opponent, the person plays X first and symbols swap on
each rematch; undo returns to the person's turn (two moves, or one while the opponent thinks).
The mode and level are preferences (`@settings`), so they survive a reload; the game itself does
not yet (phase 4).

## Tactical challenges (`src/app/game/challenge/`, `@challenge`)

A challenge is a prepared position (moves from the opening, an id, a level) where X to move wins in
two of its own moves against any defence: one **key move** leaves the defender only replies after
which X wins the game at once. `@ai` (`forcing.ts`) finds them: `keyMoves`, `refutations` (replies
that hold out) and `defend` (a game win, else a reply that holds out, else any; ties by cell
weight). `judge(start, state)` reads an attempt: `find-key`, `defending`, `finish`, `saved` (not the
key: names the reply that holds out), `missed`, `solved`. `challenge.spec.ts` asserts each one: X
to move, no win in one, exactly one key move in all eight rotations and reflections, every reply
then loses at once, and every other move is refuted. Positions were found by seeded games of the
beginner level against itself, keeping those with a single key move.

Playing one (`/challenge/:id`): `provideChallenge()` gives the route a `ChallengeRun` (the challenge
and its start), a `ChallengeSession` (games start at the position; a solving move calls
`run.onSolved`) and a `ChallengeOpponent` (replies with `defend` after the key move, passes with
null otherwise, at `OPPONENT_PACE_MS`). A null reply to the latest request is a pass in `GameStore`:
the opponent's turn stays, so the board takes no moves until Retry (`newSeries`). Solved ids are
kept once each in `Preferences.solvedChallenges`. Leaving the game route drops the game in progress
until phase 4 saves it, so Settings asks once more when a game is under way.

A rules change requires a new `rulesVersion`, new fixtures and a decision on how games saved with
the previous version are read.

## Implementation map

| File              | Contents                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| `core/models/`    | `GameState`, `Move`, statuses, `Target`, results, `RULES_VERSION`; one file each  |
| `core/lines.ts`   | The eight lines and `findLine`, shared by both levels                             |
| `core/resolve.ts` | `resolveBoard` (local) and `resolveGame` (global)                                 |
| `core/engine.ts`  | `initialState`, `legalMoves`, `applyMove`; rejection order follows rule 2         |
| `core/replay.ts`  | `replay(moves, rulesVersion)`                                                     |
| `core/index.ts`   | Public API, imported by other blocks as `@core`                                   |
| `core/testing/`   | Fixtures, `board.cell` notation, `formatState`; alias `@core/testing` (test-only) |

Canonical fixtures (`core/testing/fixtures.ts`) were found by playing the engine itself; when one
changes, re-check the property its spec asserts. `example-game.spec.ts` snapshots a full game as
text so a reviewer can follow it without Angular. fast-check prints the seed and shrink path of a
failure; turn it into a fixed regression test before fixing.
