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

| Layer      | Tool                         | Minimum                                                                                   |
| ---------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| Engine     | Vitest in Node (`test:core`) | One test per rule and per regression. `test:core` fails under 95 % coverage in `core`.    |
| Properties | fast-check (phase 1)         | Reachable sequences from the opening, mixing legal and invalid moves.                     |
| AI         | Vitest in Node               | Tactical fixtures, legal fallback with an exhausted budget, cancelled search.             |
| App        | `ng test` (Vitest + TestBed) | Store and components: double tap, late reply, restart, save error, focus.                 |
| E2E        | Playwright (`e2e/`)          | Opening → forced target → free choice, end and rematch. Keyboard, mobile, reduced motion. |

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
- Never disable a rule inline without a comment explaining why.
- All comments in English.

## Budgets

- Initial bundle: warning at 400 kB, error at 550 kB uncompressed (`angular.json`).
- Component styles: warning at 6 kB, error at 10 kB (raised from the CLI default for the board,
  the central component; split a component before going past the warning).
- Targets to measure later: local response p95 ≤ 100 ms, framing 180–280 ms, interactive board
  ≤ 2.5 s at p75 (4G, CPU ×4), opponent p95 ≤ 100 / 300 / 800 ms.
- When measuring, record device, browser, commit, network profile and build mode.

## CI

`.github/workflows/ci.yml` runs on every PR and every push to `main`: Node from `.nvmrc`, pinned
Task, `task setup`, Playwright Chromium (installed after `npm ci` so it matches the lockfile) and
`task check` (format, lint with the token check, unit tests, production build and e2e). Read-only
permissions; the Playwright report and traces are uploaded when it fails. Each new Taskfile entry
lands with the npm script it calls.

E2E specs run against the production build served by `scripts/serve-dist.mjs` (SPA fallback) on
desktop and Pixel 7 Chromium. They play through the UI with accessible names, never by reaching
into the store, and wait for the view a move produces before the next one. They run with reduced
motion so every view settles at once; one spec covers the animated narrow-screen path. Cells are
addressed by engine coordinates and named 1–9, as players see them.
