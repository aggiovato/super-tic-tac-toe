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
| Engine     | Vitest in Node (`test:core`) | One test per rule and per regression. Target: 95 % branch coverage in `core`.             |
| Properties | fast-check (phase 1)         | Reachable sequences from the opening, mixing legal and invalid moves.                     |
| AI         | Vitest in Node               | Tactical fixtures, legal fallback with an exhausted budget, cancelled search.             |
| App        | `ng test` (Vitest + TestBed) | Store and components: double tap, late reply, restart, save error, focus.                 |
| E2E        | Playwright (phase 2)         | Opening → forced target → free choice, end and rematch. Keyboard, mobile, reduced motion. |

- Readable fixtures written as move sequences.
- In the UI, query by role and accessible name; `data-testid` only for ambiguous cells.
- Wait for visible states, never fixed sleeps.
- Coverage finds gaps; it is not a goal in itself.
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
- Component styles: warning at 4 kB, error at 8 kB.
- Targets to measure later: local response p95 ≤ 100 ms, framing 180–280 ms, interactive board
  ≤ 2.5 s at p75 (4G, CPU ×4), opponent p95 ≤ 100 / 300 / 800 ms.
- When measuring, record device, browser, commit, network profile and build mode.

## CI

`.github/workflows/ci.yml` runs on every PR and every push to `main`: Node from `.nvmrc`, pinned
Task and `task ci` (install, format, lint, tests and build). Read-only permissions. Playwright
Chromium joins the PR check once the board exists (phase 2). Each new Taskfile entry lands with
the npm script it calls.
