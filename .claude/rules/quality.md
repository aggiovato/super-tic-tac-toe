---
paths:
  - 'src/**'
  - 'e2e/**'
  - '*.config.*'
  - 'Taskfile.yml'
  - '.github/**'
  - 'package.json'
---

# Quality

## Required tests per change

| Layer      | Tool                         | Minimum                                                                                         |
| ---------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Engine     | Vitest in Node (`test:core`) | One test per rule and per regression. `test:core` fails under 95 % coverage in `core` and `ai`. |
| Properties | fast-check (phase 1)         | Reachable sequences from the opening, mixing legal and invalid moves.                           |
| AI         | Vitest in Node               | Tactical fixtures, legal fallback with an exhausted budget, cancelled search.                   |
| App        | `ng test` (Vitest + TestBed) | Store and components: double tap, late reply, restart, save error, focus.                       |
| E2E        | Playwright (`e2e/`)          | Opening → forced target → free choice, end and rematch. Keyboard, mobile, reduced motion.       |

- Readable fixtures written as move sequences (`board.cell`, e.g. `'4.2 2.4'`) in `core/testing/fixtures.ts`; play them with `play()` from `core/testing/notation.ts`, which fails on the first illegal move. `core/testing/` is test-only and excluded from the app build.
- In the UI, query by role and accessible name; `data-testid` only for ambiguous cells.
- Wait for visible states, never fixed sleeps.
- Coverage finds gaps; it is not a goal in itself. Check a new rule test by breaking the engine on purpose and watching it fail.
- Test names describe behaviour in English (`it('forces O onto board 2 after X plays cell 2')`).

## Format and lint

- Prettier: 2 spaces, single quotes, trailing commas, width 100. `eslint-config-prettier` goes
  last in `eslint.config.js`.
- ESLint `--max-warnings=0`: a new warning fails CI. Active: type-aware TS
  (`no-floating-promises`, `no-explicit-any`), templates, accessibility and layer boundaries.
- `npm run lint` first runs `npm run typecheck`: every TypeScript project compiled on its own (app, specs,
  Workers, e2e, game-core, api), so a project the build does not check alone (the Workers') cannot
  hide errors. Then it runs `scripts/check-tokens.mjs` (no raw colours in app code) and
  `scripts/check-architecture.mjs` (the blocks' dependencies against `DEPENDS`, no cycles, and a
  consistent structure: aliases, index files, `SHARED` and `GAMES` in ESLint, the catalog's games).
  `scripts/*.spec.mjs` (in `test:core`) prove both checks and ESLint's boundary rules still bite.
- Size limits (`SIZE_LIMITS` in `eslint.config.js`): **500 lines per `.ts` or `.html` file, every
  line counted** (comments and blank lines too), specs and e2e included; 80 effective lines per
  function (no blanks or comments), complexity 15, depth 4, 4 parameters, 3 nested callbacks.
  Specs and e2e: no function limit and 5 nested callbacks. Past a limit, split into components or
  helpers (specs by topic, their shared helpers in `e2e/support/`); do not raise it.
- Pre-commit hook (husky + lint-staged, `lint-staged.config.mjs`): ESLint `--fix` and Prettier on
  staged files, plus the token check. Installed by `npm ci` (`prepare`). It never replaces
  `task check`.
- Commit-msg hook (commitlint, `commitlint.config.mjs`): Conventional Commits header only, the
  project's types, lowercase, no full stop, at most 100 characters, no body or trailers.
- Never disable a rule inline without a comment explaining why.
- All comments in English.

## Budgets

- Initial bundle: warning at 420 kB, error at 550 kB uncompressed (`angular.json`). Raised from
  400 kB at v0.8.0, when `main` sat at 399.95 kB and every eager change went over it.
- Component styles: warning at 6 kB, error at 10 kB (raised from the CLI default for the board,
  the central component; split a component before going past the warning).
- Targets to measure later: local response p95 ≤ 100 ms, framing 180–280 ms, interactive board
  ≤ 2.5 s at p75 (4G, CPU ×4), opponent p95 ≤ 100 / 300 / 800 ms.
- When measuring, record device, browser, commit, network profile and build mode.

## CI

`.github/workflows/ci.yml` (integration, no deploy secrets) runs on PRs and pushes to `main`, in
jobs: quality (format, lint with the typecheck, token and architecture checks, unit tests), build
(production build, uploaded as the `dist` artifact), e2e (Playwright against that artifact, with the
API under `wrangler dev`; report and traces uploaded on failure) and cd, which calls `cd.yml`
(delivery, reusable and also manual): the API first (`deploy-api.yml`), then the app per host
(`deploy-app.yml`, checking `/api/health`); a PR gets its own API and a `pr-N` preview, `main` goes to
pre and runs `e2e/online.spec.ts` against it, and a new version in `package.json` is promoted to
production and tagged. `cleanup.yml` deletes a closed PR's API. The e2e jobs (CI's and the smoke on pre) run in
Playwright's image (`mcr.microsoft.com/playwright:v1.65.1-noble`, browsers and system libraries
installed): bump its tag with `@playwright/test`, here, in `cd.yml` and in `task e2e:webkit`. A PR
stacked on another branch (base not `main`) runs quality only; build, e2e and its preview run once
it targets `main` (the retarget is an `edited` event that changes the base). `release.yml` (manual) opens a release PR, as `task release:*` does. Check workflow changes with
actionlint. Actions are pinned by SHA. `task check` is the local equivalent. Each new
Taskfile entry lands with the npm script it calls.

E2E specs run against the production build served by `scripts/serve-dist.mjs` (SPA fallback, and
`/api` with its WebSocket upgrades passed to the API Worker that Playwright starts with `wrangler dev`) on
desktop and Pixel 7 Chromium, desktop Firefox and, where its Ubuntu libraries are (CI, or
`task e2e:webkit` in Playwright's container), desktop WebKit with a 60 s test timeout. The service
worker is blocked in every spec but `e2e/offline.spec.ts`, which installs the app online, goes
offline and plays every game (Chromium only). A spec waits for a save by reading IndexedDB (an
observation, never a way to drive the game), and records a short-lived animation with a
MutationObserver instead of polling for each frame. `e2e/online.spec.ts` plays one game on two browser contexts (two devices), cutting one off with
`routeWebSocket` and checking both converge. They play through the UI with accessible names, never by reaching
into the store, and wait for the view a move produces before the next one. They run with reduced
motion so every view settles at once; one spec covers the animated narrow-screen path. Cells are
addressed by engine coordinates and named 1–9, as players see them.
