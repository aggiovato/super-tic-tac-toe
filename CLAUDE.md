# Super Tic Tac Toe

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
  no `Co-Authored-By` trailer. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`,
  `build`, `perf`. Example: `feat(core): apply a move and resolve the local board`.
- Commit or push only when asked.

## Current phase

**Phase 1 · Executable engine: done** (`src/app/game/core/`). Next: **phase 2 · Two humans**.

| Phase        | Accepted when…                                                                        |
| ------------ | ------------------------------------------------------------------------------------- |
| 0 Bootstrap  | A clean clone installs from the lockfile and CI runs the available checks.            |
| 1 Engine     | The six reference scenarios, the eight lines and the sequence invariants pass.        |
| 2 Two humans | Two people can finish and restart on mobile and desktop, by keyboard, reduced motion. |
| 3 Opponent   | Every reply is legal, restarting cancels the previous turn, search budgets hold.      |
| 4 Local MVP  | A game resumes mid-turn and each game counts a single result.                         |
| 5–7          | PWA and CD, online by invitation, accounts.                                           |

Update this table when a phase closes.

## Commands

| Task                          | What it does                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `task setup`                  | `npm ci`                                                                                 |
| `task dev`                    | `ng serve`                                                                               |
| `task fmt` / `task fmt-check` | Prettier write / check                                                                   |
| `task lint`                   | ESLint (TS, templates and accessibility), zero warnings                                  |
| `task unit`                   | `test:core` (engine typecheck, Vitest in Node, coverage gate) and `test:app` (`ng test`) |
| `task build`                  | Production build with budgets                                                            |
| `task check`                  | All of the above, in CI order                                                            |
| `task ci`                     | `setup` + `check` (what the workflow runs)                                               |

A change is not done until `task check` is green.

## Layers and boundaries

| Path                                   | Responsibility                                 | May import              |
| -------------------------------------- | ---------------------------------------------- | ----------------------- |
| `src/app/game/core/`                   | Types, rules, replay. Deterministic.           | Local TypeScript only   |
| `src/app/game/ai/`                     | Evaluation, search, levels, Worker             | `core`                  |
| `src/app/game/session/`                | Orchestrates commands, engine, storage, Worker | `core`, `ai`, `storage` |
| `src/app/game/state/`                  | GameStore (SignalStore) provided on the route  | `core`, `session`       |
| `src/app/game/ui/`                     | Board, mini board, score, controls             | `state`, `core` types   |
| `src/app/history/`, `src/app/storage/` | History, stats, IndexedDB                      | `core`                  |

ESLint stops `core` and `ai` from importing Angular, NgRx, RxJS or app layers, and `core` from
importing `ai`. Create each folder only with its first implementation.

## Rules (`.claude/rules/`)

Loaded automatically for the files you touch:

| Rule         | Scope                     | Contents                                        |
| ------------ | ------------------------- | ----------------------------------------------- |
| `angular-22` | `src/**`, Angular configs | Conventions for the installed Angular version   |
| `game`       | `src/app/game/**`         | Rules v1, engine contract, fixtures, invariants |
| `quality`    | `src/**`, configs, CI     | Required tests, lint, budgets, CI               |

`.claude/sources.md` records origin, revision and licence of every external resource and the
toolchain versions. Update it when adding or updating a skill or resource.

Project skills: `angular-developer` and `angular-new-app` in `.claude/skills/` (pinned copy of
`angular/skills`, see `sources.md`). UI work also uses `frontend-design` and `impeccable`; create
`PRODUCT.md` and `DESIGN.md` with impeccable before the first UI (phase 2).

## Definition of done

- Behaviour is shown through the normal input of the user or of the engine's consumer.
- Edge cases have a reproducible test and `task check` passes.
- A rules change adds fixtures and decides how older saved games are read.
- A visual change is checked by keyboard and in a mobile viewport.
- Record the commands run, real versions and measurements in the PR description.
