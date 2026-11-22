---
paths:
  - 'packages/api/**'
---

# The API Worker (phase 6)

`packages/api` (`@super-3t/api`): online rooms by invitation, Hono on Cloudflare Workers, one
`GameRoom` Durable Object per room. Its own Worker (`super-3t-api`, `packages/api/wrangler.jsonc`), apart from
the app's static one, because Cloudflare gives no preview URLs to a Worker holding a Durable Object;
the app will reach it through a service binding under `/api/*` (6c/6d).

## Structure

Names say _game_ room (`GameRoom`, `GameRoomService`, `GAME_ROOMS`): `Room` alone reads like Android's
persistence library and says nothing of what the room is for.

Layered, one aggregate (the room); dependencies point inward: controllers and the Durable Object
call the service, the service uses the domain and the repository contract.

| Path                                              | Layer           | Responsibility                                                                          |
| ------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| `src/index.ts`                                    | Entry           | Mounts the controllers under `/api`; exports the Durable Object class                   |
| `src/controllers/game-rooms.controller.ts`        | Controller      | HTTP: checks the input (`@catalog`), calls the room (RPC) or forwards the socket        |
| `src/durable-objects/game-room.durable-object.ts` | Transport       | Sockets (hibernatable), broadcast, the expiry alarm; delegates to the service           |
| `src/services/game-room.service.ts`               | Service         | Use cases: create, join, `seatOf`, play, rematch, view, expire (clock injected)         |
| `src/domain/game-room-rules.ts`                   | Domain          | Pure rules: `judgeMove`, `nextGame`, `gameRoomView` (no storage, clock or socket)       |
| `src/repositories/game-room.repository.ts`        | Repository      | The contract: setup, seats by token hash, games, moves, score, touch, wipe              |
| `src/repositories/sqlite/`, `memory/`             | Implementations | The Durable Object's SQLite (production); memory (service tests)                        |
| `src/models/`                                     | Models          | `game-room.model.ts` (setup, rows, score, join outcome), `protocol.model.ts` (messages) |
| `src/protocol/parse.ts`                           | Input           | Reads a client message, or refuses it                                                   |
| `src/security/tokens.ts`                          | Security        | Seat tokens (random, sent once) and their SHA-256 (what is stored)                      |

A rule about what a move may do goes to the domain with a unit test; a new use case to the service
with a test on the memory repository; a new query to the repository contract and both
implementations, with the contract spec. Phase 7's Postgres (Neon) adds implementations, not layers.

## Protocol

Its types live in `@protocol` (`packages/game-core/src/protocol/`), shared with the app
(`@online`), so both ends compile against the same messages; `src/models/` re-exports them.
`GET /api/health` answers `ok` (the e2e servers wait on it).

- **Create / join**: `POST /api/game-rooms {gameId, variant?}` checks the game against `@catalog` and
  reads the variant with it; the creator gets seat 0 and its token. `POST /api/game-rooms/:id/join` gives
  seat 1 once (`409 full`, `404` for an unknown id).
- **Socket**: `GET /api/game-rooms/:id/socket?token=…` with a WebSocket upgrade; the token names the seat.
  Every change sends each player the whole `GameRoomState` (game, symbols, moves, revision, result,
  score, seats taken and online, `you`).
- **Move**: `{type: 'move', commandId, expectedRevision, move}`. Judged with the game's own engine:
  `waiting` (no guest yet), `game-over`, `stale` (another move came first), `not-your-turn`,
  `illegal`. The sender gets `ack` (with the revision) or `refused`. A move is stored once: unique by
  game and revision and by `commandId`; a retried command gets the same `ack` again.
- **Rematch**: `{type: 'rematch', game}` starts the next game once `game` is over, symbols swapped;
  a second request for the same game is ignored. **Sync**: `{type: 'sync'}` sends the state again.
- **TTL**: any join, move or rematch pushes an alarm a week ahead; a room left alone deletes itself.

## Tests

`npm run test:api` (in `task unit`): typecheck, then Vitest inside the Workers runtime
(`@cloudflare/vitest-plugin`, storage isolated per test):

- `test/game-rooms.spec.ts`: real sockets through every protocol rule (eviction and expiry included);
- `test/services/game-room.service.spec.ts`: the use cases on the memory repository, with a test clock;
- `test/repositories/game-room-repository.contract.spec.ts`: the same contract run on memory and on the
  Durable Object's real SQLite, so service tests use a repository that behaves like production;
- `test/domain/game-room-rules.spec.ts`: the pure rules for every game of the catalog;
- `test/protocol.spec.ts`: what a client may send.

`task api:dev` runs the Worker locally with `wrangler dev`.
