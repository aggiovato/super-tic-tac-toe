---
paths:
  - 'packages/api/**'
---

# The API Worker (phase 6)

`packages/api` (`@super-3t/api`): online rooms by invitation, Hono on Cloudflare Workers, one
`GameRoom` Durable Object per room. Its own Worker (`super-3t-api`, `packages/api/wrangler.jsonc`),
apart from the app's, because Cloudflare gives no preview URLs to a Worker holding a Durable Object.
It has no public address (`workers_dev` and `preview_urls` off): the app's Worker (`edge/index.ts`)
passes `/api/*` to it through a service binding. Environments: the top level is `super-3t-api`
(production), `--env pre` is `super-3t-api-pre` (main) and `--env preview --name super-3t-api-pr-N`
is a PR's own, deleted when it closes (`cleanup.yml`). Each declares its Durable Object, migration
and rate limit again (they are not inherited). CD deploys it before the app (`deploy-api.yml`).

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

## Limits and heartbeat

- `ROOM_REQUESTS` (a rate-limit binding): 20 `POST`s (create or join) per client address
  (`cf-connecting-ip`, kept through the binding) and minute; past it `429 too-many`.
- A socket's message budget (`MessageBudget`, `src/security/limits.ts`): a burst of 20, then 4 a
  second; a flood is closed with 1008. A seat holds at most 4 sockets; a fifth upgrade gets 429.
  Messages are at most 4 KiB (`parse.ts`).
- Heartbeat (`@protocol`): the client sends `ping` every 20 s and the room answers `pong` by
  auto-response, without waking. A client that hears nothing for 50 s reconnects. While sockets
  are open the room's alarm also sweeps every 30 s and closes those silent for 50 s (a lost network
  sends no close), so the other player sees them go.

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
