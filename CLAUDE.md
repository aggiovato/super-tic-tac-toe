# Super 3T

Ultimate Tic Tac Toe in Angular 22: a local SPA for two people on one device or against a
three-level opponent. Later deliveries: offline PWA, private online rooms and accounts.

## Start here

1. Read this file, `git status` and `git log --oneline -15`. Keep previous work.
2. The full implementation guide is `docs/guia-super-tic-tac-toe.md` (Spanish, **local only**,
   gitignored like all of `docs/`). It may be missing in another clone; then work from this file
   and `.claude/rules/`. Never commit it or copy long passages into versioned files.
3. Toolchain: Node `24.22.3` (`.nvmrc`), npm 11, Task v3. Install with `task setup` (`npm ci`).
   The lockfile rules; do not run `npm install` without a reason.

## Language

- **Everything versioned is in English:** code, identifiers, comments, test names, ESLint
  messages, Taskfile descriptions, commit messages, `.claude/` and README.
- Only the local guide in `docs/` is in Spanish.
- User-facing copy is Spanish for now (`<html lang="es">`). Keep it out of logic so it can be
  localized later.

## Git

- Remote `git@github-aggiovato:aggiovato/super-tic-tac-toe.git` (SSH alias for the **aggiovato**
  key), local identity `Aggiovato <aggiovato@gmail.com>`. Never use the global (work) identity.
- **One branch per phase, created from `main`** (`phase/<n>-<slug>`, e.g. `phase/1-engine`),
  merged through a PR so CI validates it. Never commit directly to `main`. Releases are PRs too
  (`task release:*`); CD creates the tags.
- Conventional Commits, **header only**: `type(scope): summary`, lowercase, imperative, no body,
  no `Co-Authored-By` trailer, at most 100 characters. Enforced by the `commit-msg` hook
  (commitlint, `commitlint.config.mjs`). Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`,
  `build`, `perf`. Example: `feat(core): apply a move and resolve the local board`.
- Commit or push only when asked.

## Current phase

**Phase 9 · Accounts: next, not started.** Phase 8 shipped as v0.8.0: a chat between the two
players of an online room (free text, unmoderated, plain text only): `say`/`said`/`unsaid`/`chat` in
`@protocol` with one text rule for both ends (`cleanChatText`), the room's `chat` table and a chat
budget per socket in the API (`GameRoomService.say` decides a retry, a new message or a refusal in
one step), `RoomChat` in `@online` (messages shown at once, resent on reconnecting, unread per room
on this device in `RoomMemory`), and `OnlineChat`: a FAB with an Apricot unread dot (the second
recorded exception to the One Departure Rule), a glimpse at the top for about 4 s, and the chat as a
tall ticket. Nobody moves in a room before the rival is in.

Accounts (phase 9) add Neon Postgres (Hyperdrive, Drizzle) for verified history across devices.

| Phase         | Accepted when…                                                                        |
| ------------- | ------------------------------------------------------------------------------------- |
| 0 Bootstrap   | A clean clone installs from the lockfile and CI runs the available checks.            |
| 1 Engine      | The six reference scenarios, the eight lines and the sequence invariants pass.        |
| 2 Two humans  | Two people can finish and restart on mobile and desktop, by keyboard, reduced motion. |
| 3 Opponent ✓  | Every reply is legal, restarting cancels the previous turn, search budgets hold.      |
| 4 Local MVP ✓ | A game resumes mid-turn and each game counts a single result.                         |
| 5 PWA beta ✓  | Reopened offline, someone plays all three levels; an update keeps earlier games.      |
| 6 Online ✓    | Two browsers converge after playing, losing the connection and retrying; one result.  |
| 7 Ship Sink ✓ | Against each level and online, no message or view locates a rival ship still afloat.  |
| 8 Chat ✓      | Two browsers chat in a room; a reconnection keeps the talk; unread shows on the FAB.  |
| 9 Accounts    | One account sees verified results on two devices; local play needs no sign-in.        |

Update this table when a phase closes.

## Commands

| Task                               | What it does                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `task setup`                       | `npm ci`                                                                            |
| `task dev`                         | `ng serve`, with `/api` proxied to `task api:dev` (port 8787) for online play       |
| `task fmt` / `task fmt-check`      | Prettier write / check                                                              |
| `task lint`                        | ESLint (TS, templates and accessibility), zero warnings                             |
| `task unit`                        | `test:core` (engine, Node), `test:app` (`ng test`) and `test:api` (Workers runtime) |
| `task build`                       | Production build with budgets                                                       |
| `task e2e`                         | Build + Playwright (Chromium desktop and mobile, Firefox; WebKit on CI), API local  |
| `task e2e:ui`                      | Build + Playwright UI mode: run and replay each flow step by step                   |
| `task e2e:headed`                  | Build + flows in a visible browser, one at a time, 300 ms per action (`SLOW_MO`)    |
| `task api:dev`                     | The API Worker locally (`wrangler dev`) with its `GameRoom` Durable Object          |
| `task e2e:webkit`                  | Build + the flows in WebKit inside Playwright's container (Podman)                  |
| `task check`                       | `fmt-check`, `lint`, `unit` and `e2e`, in CI order                                  |
| `task release:patch\|minor\|major` | Open a release PR (`release/vX.Y.Z`: bump and CHANGELOG); also Actions → Release    |
| `task ci`                          | `setup` + `check` (what the workflow runs)                                          |

Both watch modes take Playwright arguments after `--` (`task e2e:headed -- --project=mobile -g "won"`)
and `E2E_MOTION=full` to play the animations. A change is not done until `task check` is green. Committing runs a pre-commit hook (husky +
lint-staged): ESLint with fixes, Prettier and the token check on the staged files.

## Deploy

Two Cloudflare Workers. The app (`wrangler.jsonc`, `super-3t`): the build output as static assets
with SPA routing, plus `edge/index.ts`, which runs only for `/api/*` (`run_worker_first`) and passes
it to the API through the service binding `API` (free: everything else is served without running a
Worker). The API (`packages/api/wrangler.jsonc`, rule `api`) has no public address. Cloudflare keeps
bindings in each version, so each environment binds its own API:

| Environment | When                          | API Worker                                   | App                                    |
| ----------- | ----------------------------- | -------------------------------------------- | -------------------------------------- |
| preview     | a (non-draft) PR, each push   | `super-3t-api-pr-N` (`--env preview --name`) | version alias `pr-N`, linked in the PR |
| pre         | every merge to `main`         | `super-3t-api-pre` (`--env pre`)             | version alias `pre`, then a smoke test |
| production  | `main` carrying a new version | `super-3t-api` (top level)                   | `wrangler deploy` (wrangler.jsonc)     |

A preview or pre version is uploaded with a config bound to its API (`scripts/wrangler-config.mjs`,
written next to `wrangler.jsonc` as the ignored `wrangler.generated.json`). `cleanup.yml` deletes a
PR's API when the PR closes.

CI and CD are separate workflows in one run: `.github/workflows/ci.yml` (no deploy secrets) runs
quality → build → e2e and calls `cd.yml`. CD deploys the API first (`deploy-api.yml`; a failure
stops the rest), then the app (`deploy-app.yml`, one host per call), which checks `/api/health`
through the app. On pre it then runs the two-browser online e2e against the deployed URL
(`E2E_BASE_URL`, no local servers). If `package.json`'s version has no tag yet, that run promotes:
the production API, **the same `dist` artifact** to production (a new version, since its binding
differs), and last the tag `vX.Y.Z` with a GitHub Release made from the CHANGELOG section (created
with the workflow's token, so it starts nothing else). A failure before the tag leaves the release
to retry. Runs on `main` queue instead of cancelling each other; a PR's newer push replaces its run.

Releases are PRs, opened by `scripts/release-pr.sh` from `task release:*` (on an up-to-date, clean
`main`) or from Actions → Release → Run workflow (`release.yml`, patch, minor or major): `npm version`
without a tag (bump, and `scripts/changelog-release.mjs` turns `## [Unreleased]` in `CHANGELOG.md`
into the version and date, refusing an empty one), the commit `chore(release): vX.Y.Z` on
`release/vX.Y.Z`, and the PR. Merging it is the release. The workflow opens the PR with the secret
`RELEASE_TOKEN` (a fine-grained token on this repository, Contents and Pull requests read and
write) so its CI runs; without it, with the workflow's token (GitHub then runs no CI on that PR,
and Actions must be allowed to create PRs), main is still tested and smoke-tested on pre. Notable changes go under `## [Unreleased]` as they land.
Never push a tag by hand. The very `dist/` the build job produced is what gets deployed; Cloudflare
never builds on its own. Secrets: `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit),
`CLOUDFLARE_ACCOUNT_ID`. `public/_headers` (cache and security headers) ships in the build output;
`task serve:cf` serves the build locally as Cloudflare does, the API beside it through the real
binding (`wrangler dev` with both configs, http://localhost:8790). Wrangler runs through `npx` at a
pinned version for the app, and as the API's devDependency for the API. Netlify stays as a backup
host: the repository variable `DEPLOY_TARGETS` picks where the app goes (`cloudflare` by default,
`netlify`, or `cloudflare,netlify`; previews and production, never pre); its deploy writes
Netlify's own SPA fallback (`_redirects`) first, with the secrets `NETLIFY_AUTH_TOKEN` and
`NETLIFY_SITE_ID`; it has no `/api`, so online play is off there. CD also runs by hand (Actions →
CD → Run workflow): a CI run's id and the hosts redeploy that tested build to production (the
`dist` artifact lasts 7 days); ticking `api` also deploys the production API from the chosen ref.

## Glossary

One word per idea, in code, tests and docs (user-facing copy keeps its own words: "Rival", the
train names).

| Term            | Meaning                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| game            | One game from the opening to its result (`GameRecord`, `id`).                                      |
| series          | Games between the same sides, with their score; a rematch is a new game in the same series.        |
| match           | The running pair of a series and its current game in a store (`@match`, `withMatch`).              |
| participant     | Side 0 or 1 of a series; the X and O symbols swap between them on each rematch.                    |
| computer player | The machine on side 1 (`ComputerPlayer`, `WorkerComputer`, `LocalComputer`, `ai/computer.ts`).     |
| level           | How strong the computer plays (`ComputerLevel`: beginner, intermediate, advanced).                 |
| move / revision | One accepted action of the engine / the count of them, which orders saves and, later, the server.  |
| variant         | A game's shape that is not a rule change, e.g. the Dots board size (`'3'`, `'5'`).                 |
| fleet / ship    | Ship Sink: a player's five ships (`Fleet`), placed once; each `ShipPlacement` is a bow and a way.  |
| shot / outcome  | A Ship Sink move at a cell of the rival's waters / what it did: `water`, `hit` or `sunk`.          |
| view            | What one player of a hidden-information game knows (a state with `viewer` set); nothing more sent. |
| preferences     | What a person chose on this device (`@preferences`); the Settings sheet edits them.                |

A game record names who played each side as `seats` (`local`, `computer`, later `remote`), and
`PlayMode` is `'local' | 'computer'`; records and preferences from before schema 2 (`'humans' |
'opponent'`) are read into today's shape (`readGameRecord`, `readSetup`).

## Layers and boundaries

Two trees in one npm workspace (`"workspaces": ["packages/*"]`, one lockfile): `packages/game-core/`
(`@super-3t/game-core`) is everything pure (plain TypeScript, no Angular or DOM, its own
`tsconfig.json`, tested in Node), shared by the app, its Workers and the API to come; `src/app/` the
Angular app, grouped as `core/`
(app-wide infrastructure), `layout/`, `features/` (what the player uses, the games among them) and
`ui/` (shared components).

| Path                                       | Responsibility                                                   | May import                                                       |
| ------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `packages/game-core/src/tictac/`           | Shared by the family: players, lines, a 3×3                      | Local TypeScript only                                            |
| `packages/game-core/src/catalog/`          | The games as data and engines: ids, rules, variants              | Each game's `core`, `@tictac`                                    |
| `packages/game-core/src/protocol/`         | The online protocol's types, shared with the API Worker          | `catalog`                                                        |
| `packages/game-core/src/<game>/core/`      | Types, rules, replay. Deterministic.                             | `tictac`                                                         |
| `packages/game-core/src/<game>/ai/`        | Evaluation, search, levels, Worker                               | `core`                                                           |
| `packages/game-core/src/<game>/challenge/` | Tactical challenges: positions and judging                       | `core`, `ai`                                                     |
| `src/app/features/games/<game>/session/`   | Orchestrates commands, engine, storage, Worker                   | `core`, `ai`, `challenge`, `storage`                             |
| `src/app/features/games/<game>/state/`     | The game's store (SignalStore), provided on the route            | `core`, `session`                                                |
| `src/app/features/games/<game>/ui/`        | Board, mini board, score, controls                               | `state`, `core` types                                            |
| `src/app/core/match/`                      | `withMatch`, sessions, computer, `ACTIVE_GAME`                   | `tictac`, `catalog`, `preferences`, `storage`                    |
| `src/app/layout/`                          | Layout, masthead, score, actions, save notice, settings          | `match`, `online`, `library`, `pwa`, `ui`, `preferences`, `i18n` |
| `src/app/features/library/`                | The game library (aside, games dialog, previews token)           | `match`, `catalog`, `ui`, `preferences`, `i18n`                  |
| `src/app/features/history/`                | A game's history page                                            | `layout`, `pwa`, `catalog`, `storage`, `ui`, `i18n`              |
| `src/app/core/online/`                     | Online play: rooms, the route's `OnlineRoom`, its panel          | `catalog`, `protocol`, `match`, `ui`, `i18n`                     |
| `src/app/core/pwa/`                        | New versions of the installed app (`AppUpdates`, `UpdateNotice`) | `match`, `ui`, `i18n`                                            |
| `src/app/core/storage/`                    | Game and series records, IndexedDB and memory                    | `preferences` types                                              |

The "May import" column is enforced: `DEPENDS` in `scripts/check-architecture.mjs` (part of `npm run
lint`) is its source of truth for production code, together with no cycles between blocks and a
consistent structure (each alias once, each block with an `index.ts` and an alias, each shared block
in `SHARED` and each game in `GAMES` of ESLint). A new block or dependency is added there first.
`scripts/*.spec.mjs` (run by `test:core`) prove that check and every ESLint boundary rule still
fail where they should.

Each functional block has an `index.ts` that re-exports its public API and a path alias that
points to it (`tsconfig.json` `paths`, the single source of truth; Vitest reads it through
`resolve.tsconfigPaths`):

| Alias                                                            | Block                                                                   |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@tictac`                                                        | `packages/game-core/src/tictac/`                                        |
| `@catalog` (games, rules, variants, levels)                      | `packages/game-core/src/catalog/`                                       |
| `@protocol` (online messages, shared with the API)               | `packages/game-core/src/protocol/`                                      |
| `@super3t/ui/preview`, `@classic/…`, `@dots/…` (library)         | `src/app/features/games/<game>/ui/preview/`                             |
| `@super3t/core`, `@super3t/core/testing` (tests)                 | `packages/game-core/src/super-3t/core/`                                 |
| `@super3t/ai`, `/challenge`, `/session`, `/state`, `/ui`         | `packages/game-core/src/super-3t/` · `src/app/features/games/super-3t/` |
| `@classic/core`, `/ai`, `/session`, `/state`, `/ui`              | `packages/game-core/src/classic/` · `src/app/features/games/classic/`   |
| `@dots/core`, `/ai`, `/session`, `/state`, `/ui`                 | `packages/game-core/src/dots/` · `src/app/features/games/dots/`         |
| `@fleet/core`, `@fleet/core/testing` (tests), `@fleet/ai`        | `packages/game-core/src/fleet/`                                         |
| `@match`, `@online`, `@pwa`, `@storage`, `@i18n`, `@preferences` | `src/app/core/<block>/`                                                 |
| `@layout`, `@ui`                                                 | `src/app/layout/`, `src/app/ui/`                                        |
| `@library`, `@history`                                           | `src/app/features/<block>/`                                             |

Another block is imported only through its alias (`import { applyMove } from '@super3t/core'`), never
with a relative path (`../core`) or into its files (`@super3t/core/engine`). Inside a block, files import
each other with relative paths. A sub-folder with its own audience gets its own `index.ts` and
alias too (`@super3t/core/testing`; `@match/worker`, the computer Worker's message types, so a
Worker imports no Angular or DOM). A new block needs both an `index.ts` and an alias, and its name added to
`SHARED` in `eslint.config.js`. A new game: its definition in `@catalog` (`definitions.ts`, `GAMES`),
its folder and aliases, its folder in `GAMES` in `eslint.config.js` (`scripts/check-architecture.mjs`, part
of `npm run lint`, fails until they agree), its routes and preview in `src/app/game-ui.ts`, and its
name and blurb in every language (typed by `GameId`). A game
never imports another game: what they share goes to `@tictac` (logic) or `@ui` (UI).

ESLint enforces it: no relative or deep imports across blocks; everything in `packages/game-core/src/` free of
Angular, NgRx, RxJS and app layers; `core` free of `ai`; `@tictac` free
of any game; and no game importing another. Those plain blocks run in Node with `test:core`.

Keep a block flat until its files stop being easy to scan; split into sub-folders by concept
(e.g. `core/rules/v1/` once a second `rulesVersion` exists), never in advance. Create each folder
only with its first implementation.

## Rules (`.claude/rules/`)

Loaded automatically for the files you touch:

| Rule            | Scope                                                                           | Contents                                         |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| `angular-22`    | `src/**`, Angular configs                                                       | Conventions for the installed Angular version    |
| `super-3t`      | `packages/game-core/src/super-3t/**`, `features/games/super-3t/**`, `tictac/**` | Rules v1, engine contract, fixtures, invariants  |
| `classic`       | `packages/game-core/src/classic/**`, `features/games/classic/**`                | Classic rules, engine, three opponent levels     |
| `dots`          | `packages/game-core/src/dots/**`, `features/games/dots/**`                      | Dots and Boxes rules, opponent, board, inks      |
| `fleet`         | `packages/game-core/src/fleet/**`, `features/games/fleet/**`                    | Ship Sink rules, hidden information, the view    |
| `storage`       | `src/app/core/storage/**`, `match/**`                                           | Records, saving, restoring, history              |
| `pwa`           | `ngsw-config.json`, headers, updates                                            | Service worker, offline cache, update notice     |
| `api`           | `packages/api/**`                                                               | API Worker: structure, room protocol, tests      |
| `quality`       | `src/**`, configs, CI                                                           | Required tests, lint, budgets, CI                |
| `design-tokens` | styles, templates, `ui/`                                                        | Token layers, semantic contract, adding a design |

`.claude/sources.md` records origin, revision and licence of every external resource and the
toolchain versions. Update it when adding or updating a skill or resource.

Project skills: `angular-developer` and `angular-new-app` in `.claude/skills/` (pinned copy of
`angular/skills`, see `sources.md`). UI work also uses `frontend-design` and `impeccable`.

## Product and design

- `PRODUCT.md`: users, purpose, brand commitments and principles (written with impeccable).
- `.impeccable/surfaces/src-app-games-super-3t-ui-game-page-ts.md`: the game screen's direction contract
  (departure board). Read it before changing the game UI; it is development-only and never goes
  into source or the bundle.
- `DESIGN.md`: written at the end of phase 2 from the built UI.
- User-facing copy lives only in `src/app/core/i18n/messages.ts` (es and en, typed so both stay
  complete). The language follows the browser until the player switches it.

## Definition of done

- Behaviour is shown through the normal input of the user or of the engine's consumer.
- Edge cases have a reproducible test and `task check` passes.
- A rules change adds fixtures and decides how older saved games are read.
- A visual change is checked by keyboard and in a mobile viewport.
- Record the commands run, real versions and measurements in the PR description.
