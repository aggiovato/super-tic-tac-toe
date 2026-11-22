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

**Phase 5 · PWA beta: in progress** (`phase/5-pwa`). Phase 4 shipped as v0.3 (saving and
resuming in IndexedDB, one result per game, a history per game, Dots and Boxes, the game library,
opponents named by level); its one open item is measuring interaction on a real phone (budgets in
`quality`). Done in phase 5: the Angular service worker (`ngsw-config.json`, production builds)
prefetches the whole app, so a second start plays offline, every game and level; a new version is
offered by `UpdateNotice` (`AppUpdates` in `@shell`) only once the game is saved; Playwright runs
Chromium (desktop, Pixel 7), Firefox and WebKit. Next: the release that closes the phase, then
phase 6 (online by invitation).

| Phase         | Accepted when…                                                                        |
| ------------- | ------------------------------------------------------------------------------------- |
| 0 Bootstrap   | A clean clone installs from the lockfile and CI runs the available checks.            |
| 1 Engine      | The six reference scenarios, the eight lines and the sequence invariants pass.        |
| 2 Two humans  | Two people can finish and restart on mobile and desktop, by keyboard, reduced motion. |
| 3 Opponent ✓  | Every reply is legal, restarting cancels the previous turn, search budgets hold.      |
| 4 Local MVP ✓ | A game resumes mid-turn and each game counts a single result.                         |
| 5 PWA beta    | Reopened offline, someone plays all three levels; an update keeps earlier games.      |
| 6–7           | Online by invitation, accounts.                                                       |

Update this table when a phase closes.

## Commands

| Task                               | What it does                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `task setup`                       | `npm ci`                                                                                 |
| `task dev`                         | `ng serve`                                                                               |
| `task fmt` / `task fmt-check`      | Prettier write / check                                                                   |
| `task lint`                        | ESLint (TS, templates and accessibility), zero warnings                                  |
| `task unit`                        | `test:core` (engine typecheck, Vitest in Node, coverage gate) and `test:app` (`ng test`) |
| `task build`                       | Production build with budgets                                                            |
| `task e2e`                         | Production build + Playwright (Chromium desktop and mobile, Firefox; WebKit on CI)       |
| `task e2e:ui`                      | Build + Playwright UI mode: run and replay each flow step by step                        |
| `task e2e:headed`                  | Build + flows in a visible browser, one at a time, 300 ms per action (`SLOW_MO`)         |
| `task e2e:webkit`                  | Build + the flows in WebKit inside Playwright's container (Podman)                       |
| `task check`                       | `fmt-check`, `lint`, `unit` and `e2e`, in CI order                                       |
| `task release:patch\|minor\|major` | Bump, commit `chore(release): vX.Y.Z` and tag, from an up-to-date main                   |
| `task ci`                          | `setup` + `check` (what the workflow runs)                                               |

Both watch modes take Playwright arguments after `--` (`task e2e:headed -- --project=mobile -g "won"`)
and `E2E_MOTION=full` to play the animations. A change is not done until `task check` is green. Committing runs a pre-commit hook (husky +
lint-staged): ESLint with fixes, Prettier and the token check on the staged files.

## Deploy

Netlify, static SPA. `.github/workflows/ci.yml` runs quality → build → e2e → deploy: a PR gets a
preview (alias `pr-N`, linked in a PR comment), a push to `main` is tested only, and a version tag
`vX.Y.Z` (from `task release:*` on an up-to-date `main`, then `git push --follow-tags`) is checked
against `package.json` and deployed to production. Notable changes go under `## [Unreleased]` in
`CHANGELOG.md` as they land; the release turns that section into the new version and date
(`scripts/changelog-release.mjs`, npm's `version` script) and refuses an empty one. The very `dist/` the build job produced is what
gets deployed; Netlify never builds on its own. Secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.
`public/_redirects` (SPA fallback) and `public/_headers` (cache and security headers) ship in the
build output.

## Layers and boundaries

| Path                              | Responsibility                                      | May import                                    |
| --------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `src/app/games/tictac/`           | Shared by the family: players, lines, a 3×3         | Local TypeScript only                         |
| `src/app/games/<game>/core/`      | Types, rules, replay. Deterministic.                | `tictac`                                      |
| `src/app/games/<game>/ai/`        | Evaluation, search, levels, Worker                  | `core`                                        |
| `src/app/games/<game>/challenge/` | Tactical challenges: positions and judging          | `core`, `ai`                                  |
| `src/app/games/<game>/session/`   | Orchestrates commands, engine, storage, Worker      | `core`, `ai`, `challenge`, `storage`          |
| `src/app/games/<game>/state/`     | GameStore (SignalStore) provided on the route       | `core`, `session`                             |
| `src/app/games/<game>/ui/`        | Board, mini board, score, controls                  | `state`, `core` types                         |
| `src/app/match/`                  | `withMatch` (play and storage), sessions, opponents | `tictac`, `settings`, `storage`               |
| `src/app/shell/`                  | Layout, game library, settings, history, updates    | `match`, `kit`, `settings`, `i18n`, `storage` |
| `src/app/storage/`                | Game and series records, IndexedDB and memory       | `settings` types                              |

Each functional block has an `index.ts` that re-exports its public API and a path alias that
points to it (`tsconfig.json` `paths`, the single source of truth; Vitest reads it through
`resolve.tsconfigPaths`):

| Alias                                                    | Block                             |
| -------------------------------------------------------- | --------------------------------- |
| `@tictac`                                                | `src/app/games/tictac/`           |
| `@super3t/core`, `@super3t/core/testing` (tests)         | `src/app/games/super-3t/core/`    |
| `@super3t/ai`, `/challenge`, `/session`, `/state`, `/ui` | `src/app/games/super-3t/<layer>/` |
| `@classic/core`, `/ai`, `/session`, `/state`, `/ui`      | `src/app/games/classic/<layer>/`  |
| `@dots/core`, `/ai`, `/session`, `/state`, `/ui`         | `src/app/games/dots/<layer>/`     |
| `@match`, `@shell`                                       | `src/app/<block>/`                |
| `@storage`, `@i18n`                                      | `src/app/<block>/`                |
| `@settings` (player preferences)                         | `src/app/settings/`               |
| `@kit` (shared UI: flap, button…)                        | `src/app/kit/`                    |

Another block is imported only through its alias (`import { applyMove } from '@super3t/core'`), never
with a relative path (`../core`) or into its files (`@super3t/core/engine`). Inside a block, files import
each other with relative paths. A sub-folder with its own audience gets its own `index.ts` and
alias too (`@super3t/core/testing`). A new block needs both an `index.ts` and an alias, and its name added to
`SHARED` in `eslint.config.js`; a new game adds its alias and folder to `GAMES` there. A game
never imports another game: what they share goes to `@tictac` (logic) or `@kit` (UI).

ESLint enforces it: no relative or deep imports across blocks; `@tictac` and each game's `core`,
`ai` and `challenge` free of Angular, NgRx, RxJS and app layers; `core` free of `ai`; `@tictac` free
of any game; and no game importing another. Those plain blocks run in Node with `test:core`.

Keep a block flat until its files stop being easy to scan; split into sub-folders by concept
(e.g. `core/rules/v1/` once a second `rulesVersion` exists), never in advance. Create each folder
only with its first implementation.

## Rules (`.claude/rules/`)

Loaded automatically for the files you touch:

| Rule            | Scope                                    | Contents                                         |
| --------------- | ---------------------------------------- | ------------------------------------------------ |
| `angular-22`    | `src/**`, Angular configs                | Conventions for the installed Angular version    |
| `super-3t`      | `src/app/games/super-3t/**`, `tictac/**` | Rules v1, engine contract, fixtures, invariants  |
| `classic`       | `src/app/games/classic/**`               | Classic rules, engine, three opponent levels     |
| `dots`          | `src/app/games/dots/**`                  | Dots and Boxes rules, opponent, board, inks      |
| `storage`       | `src/app/storage/**`, `match/**`         | Records, saving, restoring, history              |
| `pwa`           | `ngsw-config.json`, headers, updates     | Service worker, offline cache, update notice     |
| `quality`       | `src/**`, configs, CI                    | Required tests, lint, budgets, CI                |
| `design-tokens` | styles, templates, `ui/`                 | Token layers, semantic contract, adding a design |

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
- User-facing copy lives only in `src/app/i18n/messages.ts` (es and en, typed so both stay
  complete). The language follows the browser until the player switches it.

## Definition of done

- Behaviour is shown through the normal input of the user or of the engine's consumer.
- Edge cases have a reproducible test and `task check` passes.
- A rules change adds fixtures and decides how older saved games are read.
- A visual change is checked by keyboard and in a mobile viewport.
- Record the commands run, real versions and measurements in the PR description.
