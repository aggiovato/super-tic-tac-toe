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
  merged through a PR so CI validates it. Never commit directly to `main`.
- Conventional Commits, **header only**: `type(scope): summary`, lowercase, imperative, no body,
  no `Co-Authored-By` trailer, at most 100 characters. Enforced by the `commit-msg` hook
  (commitlint, `commitlint.config.mjs`). Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`,
  `build`, `perf`. Example: `feat(core): apply a move and resolve the local board`.
- Commit or push only when asked.

## Current phase

**Phase 6 · Online by invitation: in progress.** Phase 5 shipped as v0.4 (offline play, safe
updates, Firefox and WebKit in e2e, hosting on Cloudflare Workers with Netlify as a backup) and the
architecture was consolidated (glossary, `@catalog`, seats in records, engine and app trees,
architecture checks). Phase 6 plan, one PR each:

- 6a: npm workspaces, the engine as `packages/game-core` (merged).
- 6b: the API (`packages/api`, rule `api`): Hono on Cloudflare Workers, one `GameRoom` Durable Object per
  room (SQLite), the protocol (`commandId`, expected revision, full snapshots, reconnection, one result,
  rematch, a week's TTL), tested in the Workers runtime (done in `phase/6b-api`).
- 6c: the online session (a `remote` seat behind `play(move)`, optimistic moves reconciled with
  the server), create a room and share its link, connection state, two-browser e2e.
- 6d: deploy the API in CI (staging and production), abuse limits, the release that closes the phase.

Decided: all three games online; the API in its own Worker (`super-3t-api`), reached by the app
under `/api/*` through a service binding, since Cloudflare gives no preview URLs to a Worker holding a
Durable Object (the app keeps its PR previews); rooms expire after 7 days idle, a missing player is
waited for until then, a rematch stays in the room and swaps symbols. Accounts (phase 7) add Neon
Postgres (Hyperdrive, Drizzle) for verified history across devices.

| Phase         | Accepted when…                                                                        |
| ------------- | ------------------------------------------------------------------------------------- |
| 0 Bootstrap   | A clean clone installs from the lockfile and CI runs the available checks.            |
| 1 Engine      | The six reference scenarios, the eight lines and the sequence invariants pass.        |
| 2 Two humans  | Two people can finish and restart on mobile and desktop, by keyboard, reduced motion. |
| 3 Opponent ✓  | Every reply is legal, restarting cancels the previous turn, search budgets hold.      |
| 4 Local MVP ✓ | A game resumes mid-turn and each game counts a single result.                         |
| 5 PWA beta ✓  | Reopened offline, someone plays all three levels; an update keeps earlier games.      |
| 6 Online      | Two browsers converge after playing, losing the connection and retrying; one result.  |
| 7 Accounts    | One account sees verified results on two devices; local play needs no sign-in.        |

Update this table when a phase closes.

## Commands

| Task                               | What it does                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `task setup`                       | `npm ci`                                                                            |
| `task dev`                         | `ng serve`                                                                          |
| `task fmt` / `task fmt-check`      | Prettier write / check                                                              |
| `task lint`                        | ESLint (TS, templates and accessibility), zero warnings                             |
| `task unit`                        | `test:core` (engine, Node), `test:app` (`ng test`) and `test:api` (Workers runtime) |
| `task build`                       | Production build with budgets                                                       |
| `task e2e`                         | Production build + Playwright (Chromium desktop and mobile, Firefox; WebKit on CI)  |
| `task e2e:ui`                      | Build + Playwright UI mode: run and replay each flow step by step                   |
| `task e2e:headed`                  | Build + flows in a visible browser, one at a time, 300 ms per action (`SLOW_MO`)    |
| `task api:dev`                     | The API Worker locally (`wrangler dev`) with its `GameRoom` Durable Object          |
| `task e2e:webkit`                  | Build + the flows in WebKit inside Playwright's container (Podman)                  |
| `task check`                       | `fmt-check`, `lint`, `unit` and `e2e`, in CI order                                  |
| `task release:patch\|minor\|major` | Bump, commit `chore(release): vX.Y.Z` and tag, from an up-to-date main              |
| `task ci`                          | `setup` + `check` (what the workflow runs)                                          |

Both watch modes take Playwright arguments after `--` (`task e2e:headed -- --project=mobile -g "won"`)
and `E2E_MOTION=full` to play the animations. A change is not done until `task check` is green. Committing runs a pre-commit hook (husky +
lint-staged): ESLint with fixes, Prettier and the token check on the staged files.

## Deploy

Cloudflare Workers static assets (`wrangler.jsonc`: the build output, SPA routing, no Worker code;
free, as assets are served without running a Worker). CI and CD are separate workflows in one
run: `.github/workflows/ci.yml` (no deploy secrets) runs quality → build → e2e → release-check and
then calls `cd.yml`, which publishes that run's tested build through `deploy-app.yml` (one host per
call). A PR uploads a version with the preview alias `pr-N` (never live; linked in a
PR comment), a push to `main` is tested only, and a version tag
`vX.Y.Z` (from `task release:*` on an up-to-date `main`, then `git push --follow-tags`) is checked
against `package.json` and deployed to production. Notable changes go under `## [Unreleased]` in
`CHANGELOG.md` as they land; the release turns that section into the new version and date
(`scripts/changelog-release.mjs`, npm's `version` script) and refuses an empty one. The very `dist/` the build job produced is what
gets deployed; Cloudflare never builds on its own. Secrets: `CLOUDFLARE_API_TOKEN` (Workers
Scripts: Edit), `CLOUDFLARE_ACCOUNT_ID`. `public/_headers` (cache and security headers) ships in the
build output; `task serve:cf` serves the build locally as Cloudflare does (`wrangler dev`). Wrangler
runs through `npx` at a pinned version, never as a dependency (its runtime would weigh on every
`npm ci`). Netlify stays as a backup host: the repository variable `DEPLOY_TARGETS` picks where CD
deploys (`cloudflare` by default, `netlify`, or `cloudflare,netlify`); its deploy writes Netlify's own
SPA fallback (`_redirects`) first, with the secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`. CD
also runs by hand (Actions → CD → Run workflow): a CI run's id and the hosts redeploy that tested
build to production, e.g. to switch to the backup without a new tag (the `dist` artifact lasts 7
days). A preview deploy may be cancelled by a newer push; a production one always finishes.

## Glossary

One word per idea, in code, tests and docs (user-facing copy keeps its own words: "Rival", the
train names).

| Term            | Meaning                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| game            | One game from the opening to its result (`GameRecord`, `id`).                                     |
| series          | Games between the same sides, with their score; a rematch is a new game in the same series.       |
| match           | The running pair of a series and its current game in a store (`@match`, `withMatch`).             |
| participant     | Side 0 or 1 of a series; the X and O symbols swap between them on each rematch.                   |
| computer player | The machine on side 1 (`ComputerPlayer`, `WorkerComputer`, `LocalComputer`, `ai/computer.ts`).    |
| level           | How strong the computer plays (`ComputerLevel`: beginner, intermediate, advanced).                |
| move / revision | One accepted action of the engine / the count of them, which orders saves and, later, the server. |
| variant         | A game's shape that is not a rule change, e.g. the Dots board size (`'3'`, `'5'`).                |
| preferences     | What a person chose on this device (`@preferences`); the Settings sheet edits them.               |

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

| Path                                       | Responsibility                                                   | May import                                             |
| ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `packages/game-core/src/tictac/`           | Shared by the family: players, lines, a 3×3                      | Local TypeScript only                                  |
| `packages/game-core/src/catalog/`          | The games as data and engines: ids, rules, variants              | Each game's `core`, `@tictac`                          |
| `packages/game-core/src/<game>/core/`      | Types, rules, replay. Deterministic.                             | `tictac`                                               |
| `packages/game-core/src/<game>/ai/`        | Evaluation, search, levels, Worker                               | `core`                                                 |
| `packages/game-core/src/<game>/challenge/` | Tactical challenges: positions and judging                       | `core`, `ai`                                           |
| `src/app/features/games/<game>/session/`   | Orchestrates commands, engine, storage, Worker                   | `core`, `ai`, `challenge`, `storage`                   |
| `src/app/features/games/<game>/state/`     | The game's store (SignalStore), provided on the route            | `core`, `session`                                      |
| `src/app/features/games/<game>/ui/`        | Board, mini board, score, controls                               | `state`, `core` types                                  |
| `src/app/core/match/`                      | `withMatch`, sessions, computer, `ACTIVE_GAME`                   | `tictac`, `catalog`, `preferences`, `storage`          |
| `src/app/layout/`                          | Layout, masthead, score, actions, save notice, settings          | `match`, `library`, `pwa`, `ui`, `preferences`, `i18n` |
| `src/app/features/library/`                | The game library (aside, games dialog, previews token)           | `match`, `catalog`, `ui`, `preferences`, `i18n`        |
| `src/app/features/history/`                | A game's history page                                            | `layout`, `pwa`, `catalog`, `storage`, `ui`, `i18n`    |
| `src/app/core/pwa/`                        | New versions of the installed app (`AppUpdates`, `UpdateNotice`) | `match`, `ui`, `i18n`                                  |
| `src/app/core/storage/`                    | Game and series records, IndexedDB and memory                    | `preferences` types                                    |

The "May import" column is enforced: `DEPENDS` in `scripts/check-architecture.mjs` (part of `npm run
lint`) is its source of truth for production code, together with no cycles between blocks and a
consistent structure (each alias once, each block with an `index.ts` and an alias, each shared block
in `SHARED` and each game in `GAMES` of ESLint). A new block or dependency is added there first.
`scripts/*.spec.mjs` (run by `test:core`) prove that check and every ESLint boundary rule still
fail where they should.

Each functional block has an `index.ts` that re-exports its public API and a path alias that
points to it (`tsconfig.json` `paths`, the single source of truth; Vitest reads it through
`resolve.tsconfigPaths`):

| Alias                                                    | Block                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@tictac`                                                | `packages/game-core/src/tictac/`                                        |
| `@catalog` (games, rules, variants, levels)              | `packages/game-core/src/catalog/`                                       |
| `@super3t/ui/preview`, `@classic/…`, `@dots/…` (library) | `src/app/features/games/<game>/ui/preview/`                             |
| `@super3t/core`, `@super3t/core/testing` (tests)         | `packages/game-core/src/super-3t/core/`                                 |
| `@super3t/ai`, `/challenge`, `/session`, `/state`, `/ui` | `packages/game-core/src/super-3t/` · `src/app/features/games/super-3t/` |
| `@classic/core`, `/ai`, `/session`, `/state`, `/ui`      | `packages/game-core/src/classic/` · `src/app/features/games/classic/`   |
| `@dots/core`, `/ai`, `/session`, `/state`, `/ui`         | `packages/game-core/src/dots/` · `src/app/features/games/dots/`         |
| `@match`, `@pwa`, `@storage`, `@i18n`, `@preferences`    | `src/app/core/<block>/`                                                 |
| `@layout`, `@ui`                                         | `src/app/layout/`, `src/app/ui/`                                        |
| `@library`, `@history`                                   | `src/app/features/<block>/`                                             |

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
- `.impeccable/surfaces/src-app-game-ui-game-page-ts.md`: the game screen's direction contract
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
