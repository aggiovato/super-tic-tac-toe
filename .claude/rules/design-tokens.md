---
paths:
  - 'src/**/*.css'
  - 'src/**/*.html'
  - 'src/app/**/ui/**'
  - 'scripts/check-tokens.mjs'
---

# Design tokens

Three layers, so a new design is a new file, never a component rewrite.

| Layer        | File                             | Contents                                                                       | Used by                     |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------ | --------------------------- |
| 1 · Scales   | `src/styles/tokens/scales.css`   | `--ref-size-*`, `--ref-space-*`, `--ref-radius-*`, `--ref-stroke-*`, durations | Token files only            |
| 2 · Semantic | `src/styles/tokens/semantic.css` | Roles: colour, type, radius, space, borders, motion. The contract.             | Templates and component CSS |
| 3 · Design   | `src/styles/themes/<name>.css`   | The design's palette primitives (`--ref-*`) and overrides of semantic tokens   | Selected on `<html>`        |

`src/styles.css` imports them in that order. Departures (the brand in PRODUCT.md) is the default:
the semantic layer's values point at its primitives.

## Rules

- Components and templates use **semantic tokens only**: Tailwind utilities generated from them
  (`bg-surface-panel`, `text-fg-strong`, `rounded-panel`, `gap-board-gap`, `text-flap`) or
  `var(--color-…)`, `var(--border-…)`, `var(--duration-…)` in component CSS.
- Never a raw colour, a `--ref-*` primitive or a Tailwind default palette, size or radius outside
  `src/styles/`. Tailwind's default colours, text sizes, radii and fonts are reset in
  `semantic.css`, and `node scripts/check-tokens.mjs` (part of `npm run lint`) rejects hex values,
  colour functions and `--ref-*` in app code.
- A component may define **component tokens** on `:host` (`--platform-bg`, `--flap-fg`) built
  from semantic tokens, and override them for its variants. That is the only place raw lengths
  that belong to one component live (e.g. `--thumbnail-size`).
- Spacing uses Tailwind's 4 px `--spacing` multiplier (`p-4`, `calc(var(--spacing) * 2)`) or a
  semantic space (`gutter`, `stack`, `stack-tight`, `stack-loose`, `board-gap`, `cell-gap`,
  `panel-pad`).
- Name tokens by role, not by value or hue (`--color-target`, not `--color-orange`).
- Add a semantic token only when a role is used in more than one place or a design could
  reasonably change it on its own. Otherwise keep a component token.

## Semantic contract

| Group  | Tokens                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour | `surface`, `surface-panel`, `surface-raised`, `surface-done`, `fg-disabled`, `glow`, `shade`, `fg`, `fg-strong`, `line`, `line-strong`, `accent`, `on-accent`, `focus`                          |
| Game   | `mark-x`, `mark-o`, `target`, `last-move`, `preview`, `win`, `spark`                                                                                                                            |
| Type   | `caption` 14, `body` 18, `title` 24, `score` 36, `flap` fluid 36–60 (each with its line height)                                                                                                 |
| Radius | `cell` < `tile` < `panel` < `control` < `pill`: smaller parts get smaller radii                                                                                                                 |
| Border | `--border-hairline` 1, `--border-line` 2, `--border-emphasis` 3 (forced board, focus ring)                                                                                                      |
| Motion | `--duration-step` (one flap character), `--duration-quick`, `--duration-frame`, `--duration-zoom` (board opening), `--duration-draw` (strike lines), `--ease-flap`, `--ease-out`, `--ease-zoom` |

Accessibility is part of the contract: `fg` on every surface ≥ 4.5:1, `line` ≥ 3:1 on `surface`
and `surface-panel`, `focus` never equal to `accent` or `target`, and the target always carries a
shape cue (thick border, filled number) besides its colour. A new design must re-check these.

## Designs and shared components

- Designs today: `departures` (default) and `departures-contrast` (brighter text and strokes,
  darker panels), chosen in the settings panel and applied as `data-theme` on `<html>` by
  `Preferences` (`@settings`).
- The motion setting sets `data-motion="full|reduced"` on `<html>`; `reduced` disables every CSS
  animation and transition, and components read `Preferences.reducedMotion()` for JS-driven motion
  (flap cycling, view transitions).
- Player inks (`--color-player-x` Verdigris, `--color-player-o` Sand, brighter in high contrast)
  colour each player's lines and boxes in games that need it (Dots and Boxes); Super 3T and the
  classic game keep the shared mark ink. The X or O mark always tells players apart too.
- Shared visual components live in `@kit` (`src/app/kit/<name>/`): `SplitFlap`, `StrikeLine`,
  `Ticket` (the how-to-play departure ticket), `DepartureBoard`, `BoardCell`, `ClosingMark`,
  `Icon`, `LevelBars` (a level as three rising bars, shape not colour), `Backdrop` (two torn-paper strips from the brand artwork in `public/textures/tears/`, `--backdrop-opacity`, `--backdrop-blur`) `Button` (`<button app-button="primary|secondary|quiet">`), `Choice` (a radio or checkbox with
  label and hint) and `ChoiceGroup` (a titled set of radios over `ChoiceOption`s). Each keeps its styles
  encapsulated and built from semantic tokens only.

## Adding a design

1. Create `src/styles/themes/<name>.css` with its primitives and a
   `[data-theme='<name>'] { --color-…: …; }` block overriding the semantic tokens it changes.
2. Import it in `src/styles.css` after `departures.css`.
3. Select it with `data-theme="<name>"` on `<html>`.
4. Check contrast for the pairs above and run `task check`.
