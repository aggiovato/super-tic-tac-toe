---
paths:
  - 'src/**'
  - 'angular.json'
  - 'tsconfig*.json'
---

# Angular 22 in this project

Installed: `@angular/core` 22.3.0, `@angular/cli` 22.2.7, TypeScript 6.0.3. Sources: the
`angular-developer` skill (pinned at `angular/skills@38b2fc9`, release v22.3.0) and the official
style guide (https://angular.dev/style-guide). Reviewed 2026-11-18. When the minor changes,
review this file and `.claude/sources.md`.

## Configuration

- `strict` and `strictTemplates` are set explicitly in `tsconfig.json`, even though TS 6 and
  Angular 22 default to them. Do not remove them.
- Block aliases (`@core`, `@ai`, `@state`…) live in `tsconfig.json` `paths` (no `baseUrl`, TS 6).
  Angular and Vitest both resolve them from there; never duplicate them in another config.
- Standalone components and CLI 22 defaults: zoneless, and `OnPush` is the default change
  detection. Do not add `standalone: true`, an explicit `OnPush` or Zone.js.
- v20+ naming: `game-board.ts` with class `GameBoard`, no `.component` suffix.
- Selector prefix `app-` (kebab-case components, camelCase directives), enforced by ESLint.

## Code

- Inputs and outputs with `input()`, `input.required()`, `output()` and `model()`, always typed.
- Derived state with `computed()`. Use `effect()` only to sync with the outside world (DOM,
  storage), never to propagate state.
- Templates use `@if`, `@for` (with `track` on a stable identity, e.g. `track cell.index`) and
  `@switch`. No `*ngIf` or `*ngFor`.
- No expensive work in templates: no building, filtering or sorting arrays. Derive it in a
  `computed` or in the engine.
- The template renders state and emits intents (`play({ board, cell })`). Repeatable logic lives
  in the engine.
- Subscriptions, the Worker and timers are bound to the route lifecycle (`DestroyRef`,
  `takeUntilDestroyed`). No loose subscriptions.
- Inject with `inject()`. GameStore is provided on the game route, not in `root`.
- No user-facing string in templates or TS: read it from `Translator.t()` (`@i18n`).
- State that lives with a route (GameStore, its session) is provided in the route's `providers`.
- New forms (phase 7): Signal Forms.
- Use the CLI (`npx ng generate …`) to scaffold, then adapt the output.

## App tests

- `ng test` (`unit-test` builder + Vitest) runs every spec under `src/` **except** `game/core`
  and `game/ai`, which run in Node with `npm run test:core`. Never duplicate specs across both.
- Inject a controllable session and Worker. In the UI, query by role and accessible name.
