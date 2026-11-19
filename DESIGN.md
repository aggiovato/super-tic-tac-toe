---
name: Super 3T
description: Ultimate Tic Tac Toe told as a split-flap departure board, where every move announces the board your opponent departs to.
colors:
  raven-teal: '#16292b'
  raven-deep: '#0f1f21'
  raven-deepest: '#0a1516'
  raven-lift: '#1d3437'
  ink: '#050b0c'
  seagrass-grey: '#9fb3ab'
  seagrass-dim: '#657874'
  chalk: '#dce6e1'
  apricot-flare: '#ff8a1f'
typography:
  flap:
    fontFamily: 'Barlow Semi Condensed, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(2.25rem, 11vw, 3.75rem)'
    fontWeight: 700
    lineHeight: 1
    fontFeature: 'tnum'
  score:
    fontFamily: 'Barlow Semi Condensed, ui-sans-serif, system-ui, sans-serif'
    fontSize: '2.25rem'
    fontWeight: 700
    lineHeight: 1
    fontFeature: 'tnum'
  title:
    fontFamily: 'Barlow Semi Condensed, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: 'Barlow Semi Condensed, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: 'Barlow Semi Condensed, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 600
    lineHeight: 1.3
rounded:
  cell: '0.125rem'
  tile: '0.25rem'
  panel: '0.5rem'
  control: '0.75rem'
  pill: '9999px'
spacing:
  cell-gap: '2px'
  stack-tight: '0.5rem'
  stack: '1rem'
  gutter: '1rem'
  stack-loose: '2rem'
  board-gap: 'clamp(0.5rem, 2.5vw, 1rem)'
  panel-pad: 'clamp(0.25rem, 1.5vw, 0.75rem)'
components:
  button-primary:
    backgroundColor: '{colors.apricot-flare}'
    textColor: '{colors.raven-teal}'
    typography: '{typography.body}'
    rounded: '{rounded.control}'
    padding: '0 1rem'
    height: '2.75rem'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.seagrass-grey}'
    typography: '{typography.body}'
    rounded: '{rounded.control}'
    padding: '0 1rem'
    height: '2.75rem'
  button-secondary-hover:
    backgroundColor: '{colors.raven-lift}'
  button-quiet:
    backgroundColor: 'transparent'
    textColor: '{colors.seagrass-grey}'
    rounded: '{rounded.control}'
    padding: '0 0.5rem'
    height: '2.75rem'
  button-disabled:
    backgroundColor: 'transparent'
    textColor: '{colors.seagrass-dim}'
  flap-tile:
    backgroundColor: '{colors.raven-deep}'
    textColor: '{colors.seagrass-grey}'
    typography: '{typography.flap}'
    rounded: '{rounded.tile}'
    width: '0.78em'
    height: '1.18em'
  flap-tile-accent:
    backgroundColor: '{colors.raven-deep}'
    textColor: '{colors.apricot-flare}'
  platform:
    backgroundColor: '{colors.raven-deep}'
    rounded: '{rounded.panel}'
    padding: '{spacing.panel-pad}'
  platform-playable:
    backgroundColor: '{colors.raven-lift}'
  input-text:
    backgroundColor: '{colors.raven-teal}'
    textColor: '{colors.chalk}'
    typography: '{typography.body}'
    rounded: '{rounded.control}'
    padding: '0 1rem'
    height: '2.75rem'
  settings-sheet:
    backgroundColor: '{colors.raven-deep}'
    textColor: '{colors.seagrass-grey}'
    padding: '1rem'
    width: 'min(24rem, 100vw)'
  brand-mark:
    backgroundColor: '{colors.raven-deep}'
    textColor: '{colors.apricot-flare}'
    width: '180px'
  brand-mark-small:
    backgroundColor: '{colors.raven-deep}'
    textColor: '{colors.apricot-flare}'
    width: '16px'
  brand-lockup:
    textColor: '{colors.chalk}'
    typography: '{typography.title}'
    height: '1.6em'
---

# Design System: Super 3T

## Overview

**Creative North Star: "The Departure Board"**

Every move is a departure. The screen reads like a station's split-flap board: a row of dark teal flap tiles announces who moves and which board they depart to ("X → 2", "X → FREE", "X WINS"), and the nine mini boards below are numbered platforms waiting for that announcement. The rule of the game (the cell you play decides where your opponent plays) is shown by the board flipping, not explained by a manual.

The world is dark, flat and quiet by default. A Raven Teal ground carries a soft wash of light and shade plus two faint torn-paper strips from the owner's artwork, so the page has atmosphere without any component competing with the board. Seagrass Grey does all the everyday work: text, strokes, both X and O. Apricot Flare is spent only on the departure (the forced board, its number, the one primary action) and on a win. Density is game-like: one screen, no scrolling during play, the board taking every pixel the layout allows.

Motion is mechanical, not decorative: flaps fall top half then bottom half and cycle through the drum to their character, staggered left to right; a closed board has its large mark drawn on; a win draws its line. A player's motion setting overrides the system one in both directions, and every effect has an instant equivalent.

**Key Characteristics:**

- Split-flap tiles with a hairline split across the middle are the signature unit: departure row, platform numbers, cells and score digits are all flaps.
- Three-colour brand palette in roughly 60 / 30 / 10 proportion (Raven Teal / Seagrass Grey / Apricot Flare), plus derived tints and shades only.
- One family, Barlow Semi Condensed, with tabular figures everywhere.
- Flat components on a softly lit ground; depth comes from tonal steps and one soft panel shadow.
- The forced target is always the most visible thing on screen, and always carries a shape cue besides colour.

## Colors

A dark teal world with one warm signal: the palette is nearly monochrome so that the single orange reads as an announcement.

### Primary

- **Apricot Flare** (apricot-flare): the departure. The forced platform's border and its flap number, the accent characters in the departure row, the primary button, the winning line and the winner's large marks. Also the text selection fill and the T of the brand mark (see the exception under the One Departure Rule). Nothing else.

### Neutral

- **Raven Teal** (raven-teal): the page ground (about 60% of any screen), the text on the primary button, the field fill in settings.
- **Raven Deep** (raven-deep): platforms at rest, flap tiles, finished boards, the settings sheet.
- **Raven Deepest** (raven-deepest): panels and finished boards in the high-contrast design only.
- **Raven Lift** (raven-lift): playable platforms, hover and pressed fills, faded grid lines on boards that cannot be played this turn; also the light half of the page wash.
- **Ink** (ink): shadows and the page vignette only, never a surface.
- **Seagrass Grey** (seagrass-grey): body text, icons, flap characters, both X and O, primary strokes and hover outlines.
- **Seagrass Dim** (seagrass-dim): secondary strokes (grid lines, neutral outlines, button and field borders) and disabled controls; at least 3:1 on every surface.
- **Chalk** (chalk): emphasis. The title, the current player, the last-move ring, the departure preview ring and the keyboard focus ring.

### Named Rules

**The One Departure Rule.** Apricot Flare marks where the next move may go, the one primary action, and a win. A second use of orange on a screen is a bug. One sanctioned exception, by the owner's decision: the Apricot T of the brand mark in the header lockup, because the mark is drawn in the win accent and lives in the header. It is the only one; the mark appears once per screen, never inside the board, the departure row or a control, and nothing else may cite it to add orange.

**The Shared Ink Rule.** X and O are both drawn in Seagrass Grey (Chalk in high contrast). Shape tells them apart, never colour; the accent is reserved for the departure.

**The Focus Is Not The Accent Rule.** The keyboard focus ring is Chalk, 3px, offset 3px; never Apricot Flare, so focus can never be mistaken for the forced target.

**The Role Name Rule.** Code uses role tokens (`--color-target`, `--color-surface-panel`), never hue names or raw values; a new design is a new theme file overriding those roles (see `.claude/rules/design-tokens.md`).

## Typography

**Display Font:** Barlow Semi Condensed (with ui-sans-serif, system-ui fallback), served locally
**Body Font:** Barlow Semi Condensed
**Label/Mono Font:** none distinct; tabular figures (`font-variant-numeric: tabular-nums`) are set on the root

**Character:** a single condensed grotesque doing the job of station signage: bold and tight on the flaps, plain and readable in the explanatory sentence. Weights in use are 500, 600 and 700 only.

### Hierarchy

- **Flap** (700, fluid 36–60px, line-height 1): the departure row. Each character sits in its own tile.
- **Score** (700, 36px, line-height 1): series score digits, also flap tiles.
- **Title** (600, 24px, line-height 1.15): the masthead name only.
- **Body** (500, 18px, line-height 1.4): the "why" sentence under the departure row (max 60ch, fixed three-line height so a replacement never moves the board), buttons (600, primary 700), settings choices.
- **Label** (600, 14px, line-height 1.3): score labels, settings legends (700, Chalk) and field captions, small buttons.

Platform numbers and cell numbers scale with their container (platform number clamp 14–24px, 20–36px on an open board; cell hint numbers clamp 10–18px, bold).

### Named Rules

**The Tabular Everywhere Rule.** Every digit on screen is tabular so flaps and scores never shift width while cycling.

**The Sentence Case Rule.** Copy is written in sentence case at normal tracking. Capitals appear only as characters on flap tiles, where the board itself is the uppercase device.

## Layout

One screen, no scroll during play. Phones use a single column (masthead, departure row with its sentence, the board arena flexing to fill, then score and actions in the thumb zone) inside a 16px gutter. From 48rem wide in landscape (aspect at least 5:4) the page becomes two columns: a side column of 18–26rem for masthead, departures, score and actions, and the board on the right at full viewport height; gaps and block padding open up to 32px. The page is capped at 80rem and centred.

The board sizes from its arena as a size container. Every platform's 3×3 grid is square, so a platform is a card one number row taller than it is wide, and the board is three number rows taller than wide: full width on phones, as wide as the height allows on short screens. Platforms sit on a 3×3 grid with a fluid 8–16px gap; inside each, the 3×3 cells are separated by 2px gaps through which the grid line colour shows. On narrow screens a single platform opens zoomed (its grid square too) with a global thumbnail above it that leads back to the full board. Movements run one after another, never crossing: after a move the open board shrinks into its slot and the other boards fade in as it lands; after a beat, the others fade out and the forced board grows from its own slot (520ms, eased in and out). A closed board draws its large mark and line once, when it closes; views rebuilt later show them already drawn.

Spacing rhythm is 4px-based: 8px inside a block, 16px between blocks, 32px between sections. Touch targets are at least 44×44px.

## Elevation & Depth

Components are flat; depth is tonal. The ground is Raven Teal under a fixed radial light (Raven Lift, top left) and a fixed vignette (Ink, bottom right), with two softened torn-paper strips (Seagrass at very low opacity, 0.2 layer opacity, 0.6px blur) running off the page edges behind everything. Panels sit one tone darker than the ground and lift with a single soft shadow. The only other shadows are drop shadows under drawn marks so a line can pass beneath them.

### Shadow Vocabulary

- **Panel lift** (`box-shadow: 0 0.375rem 1.25rem -0.25rem var(--color-shade)`): every full-size platform over the page. Not on thumbnail platforms.
- **Mark drop** (`filter: drop-shadow(0 0.25rem 0.5rem var(--color-shade))`): the large X, O or draw mark over a closed board.
- **Line drop** (`filter: drop-shadow(0 0.125rem 0.375rem var(--color-shade))`): strike lines.

### Named Rules

**The Atmosphere Carries No Information Rule.** The wash and the torn strips are decoration only. The high-contrast design removes them (backdrop opacity 0, no glow), and nothing is lost.

**The No Glow Rule.** No component glows. State is shown by borders, rings and tone; the only spectacle is a win (orange line and marks). One transient exception, by the author's decision: a board closing crackles once, an uneven chalk flicker of its outline (`--color-spark`) with a brief shake (about 600ms), and a won game flashes its three winning boards three times in the accent (about 1s). Both are skipped with reduced motion; nothing stays lit.

## Shapes

Gently rounded, and smaller parts get smaller radii: cells 2px, flap tiles and rings 4px, platforms 8px, controls and fields 12px, radio dots full pill. Borders are the main state vocabulary: hairline 1px (sheet edge), line 2px (grid gaps, buttons, fields, cell rings), emphasis 3px (platform outlines, focus ring). Every flap tile is cut by a hairline split at its middle in the ground colour. Marks are round-capped strokes: X and O drawn in SVG with round caps and joins, never type glyphs; the large closing mark sits on a halo in the board colour.

## Components

### Buttons

One family on a native `<button>`: tactile, plain and condensed.

- **Shape:** gently rounded (control radius), 2px border, min height 44px, 16px inline padding.
- **Primary:** Apricot Flare fill, Raven Teal text, weight 700. At most one per view (Rematch when a game ends). Hover draws a 2px inset ring in Raven Teal.
- **Secondary:** transparent with a Seagrass Dim outline and Seagrass text (Undo); hover fills Raven Lift.
- **Quiet:** text only with 8px inline padding (Settings, close); hover fills Raven Lift.
- **Small:** label size text.
- **Disabled:** transparent, Raven Lift border, Seagrass Dim text, not-allowed cursor.
- **Focus:** the global Chalk ring.

### Inputs / Fields

- **Text field:** Raven Teal fill on the panel, 2px Seagrass Dim border, control radius, 44px tall, Chalk text at body size.
- **Radios and checkboxes:** drawn from tokens, 20px, 2px Seagrass Dim border on Raven Teal; a Chalk dot or check scales in when checked and the border turns Chalk; hover strengthens the border to Seagrass Grey.

### Settings Sheet

A native popover. On wide screens a full-height sheet on the right (up to 24rem) with a hairline left edge; under 35rem a bottom sheet up to 88% of the viewport with rounded top corners. Raven Deep fill over a 70% Raven Teal scrim; fieldsets separated by 32px, each with a Chalk label legend.

### Split-Flap Tile (signature)

The atomic unit of the world. A tile 0.78em wide and 1.18em tall in Raven Deep with tile radius, a bold Seagrass character (or authored SVG glyph: arrow, X, O), and a hairline split across the middle. Accent tiles turn the character Apricot Flare. Changing character drops the top half then lands the bottom half (60ms per step, flap easing), cycling through the drum up to a few steps, staggered by position so words form left to right. Reduced motion swaps instantly. Used for the departure row, platform numbers, cells and score digits.

### Platform (signature)

A numbered mini board: a flap number (1–9) over a 3×3 grid of flap cells, on Raven Deep with panel radius, panel padding and the panel lift shadow, inside a 3px transparent border that carries its state.

- **Playable:** fill steps up to Raven Lift; hover outlines it in Seagrass Grey.
- **Not playable:** grid lines fade to Raven Lift; marks stay.
- **Forced:** 3px Apricot Flare outline and an Apricot number. Kept on the thumbnail even while open.
- **Free choice (opening included):** every playable platform gets a 3px Seagrass Dim outline.
- **Preview:** a hovered (140ms intent delay) or focused legal cell rings the destination platform's number tile in Chalk; the departure row stays still until the move is committed.
- **Closed:** Raven Deep, faded small marks, and a large round-capped X, O or draw mark drawn on over a halo; the winner's three boards turn their large marks Apricot.
- **Cells:** a 2px ring inset in the cell marks last move (Chalk), hover (Seagrass Grey) and focus (3px Chalk). Optional hint numbers appear on hover and focus.
- **Mini (thumbnail):** 1px padding, cell radius, 2px border, no head, no shadow; the current board outlined in Chalk.

### Strike Line

A round-capped Apricot line drawn on across three cells or three boards, with a line drop shadow; the game-winning line is thinner and starts after the board closes.

### Icons

Authored line icons on a 24px grid, 2px stroke, round caps and joins, 1.1em, in currentColor, always beside a text label.

### Brand Mark (signature)

The name as a departure board in miniature: a T that is a split-flap tile just landed, and a smaller 3 tile falling onto it. One source draws it and writes every asset (`scripts/build-icons.mjs`, `npm run icons` / `task icons`); edit the drawing there, never the outputs.

- **Full mark** (100-unit box, `public/icons/mark.svg`): the whole square is the T's flap tile in Raven Deep, its top half a step lighter (#172c2f), split by a hairline in Ink at 85% (0.8 units) that runs edge to edge and crosses the T's stem. The T is Apricot Flare, round caps (stroke 11, bar at a third down, stem ending near the bottom fifth, right of centre), on a halo in the tile colour (stroke 16) with the mark drop shadow, and a faint light (#ffc07a at 50%, stroke 3) along the top edge of the bar only. The 3 is Chalk, a single round-capped, round-joined stroke, on its own small two-tone tile (#1a3033, top half #22393c, radius 4.5 on 26×30) rotated −12°, top left, resting on the left end of the T's bar and casting its drop shadow on it. The tile's hairline crosses the 3's tile too (Ink at 85%). No other colour, no gradient beyond the two flap halves.
- **Small drawings** (16-unit grid, strokes on half pixels): both drop the 3 tile, the halo and the light and keep the rounded Raven Deep tile (radius 3.5 of 16). The T is Apricot (stroke 2.5, bar from 8.25 to 14.5 at 3.75, stem at 11.4 from 3.75 to 13); the 3 is Chalk alone (stroke 1.8 in its scaled space), about 78% of the T's height (scale 0.86) and tilted −10°. Each must read "3T" at its size.
  - **Small flat** (`public/favicon.svg`, which tabs render at 16 CSS px, and the 16px frame of `favicon.ico`): plain tile, no tone split, no hairline; at 16px the split blurs the 3.
  - **Small flap** (`public/icons/mark-small.svg`, the 32 and 48px frames of `favicon.ico`, the header lockup): the flap tile's two halves (Raven Deep, top half #172c2f) with the split hairline (Ink at 85%) running behind the T only (from x 8.4 to the right edge), never through the 3. Shown large (the social preview) the 3 cannot blur, so there the split runs edge to edge, the 3 drawn above it.
- **Size rule:** the full mark above 48px (the smallest shipped is the 180px apple-touch icon); at 48px and below the small flap drawing, except at 16px, where the small flat drawing is used. At 48px and below the full mark collapses into a cube that reads "³T". Where the mark stands for "3T" inside the title (header lockup, social preview) it is always the small flap drawing, at any size: there it is letters, and the full mark's small 3 would sit in superscript ("Super³T").
- **Platform variants:** "any" manifest icons (192, 512) and `mark.svg` keep the rounded tile (radius 22 of 100). Apple-touch (180, drawing at 0.9) and maskable icons (192, 512, drawing at 0.7) are full bleed and let the platform mask them; maskable content stays inside the central 80% safe circle. The edge-to-edge hairline keeps its full width at every scale. Manifest background and theme colour are Raven Teal.
- **Header lockup:** the heading reads "Super" (title size and weight, Chalk) followed by the small flap drawing (`icons/mark-small.svg`) at 1.6em, 0.3em after the word, centred on the text line. The mark is the "3T" of the name: there is no "3T" text, the image carries alt "3T", and the heading's accessible name is "Super 3T".
- **Brand flaps (TIP/TAP/TOE):** when a board is won, two split-flap tiles unfold right after the mark's T as two more tiles of the mark's board, as tall as the mark (flap font size 1.6em ÷ 1.18, since a tile is 1.18em tall), 0.06em apart, in the mark's two halves (`--flap-bg`: Raven Teal over Raven Deep, half and half) with its corner radius (`--flap-radius`: 3.5 of 16 at the mark's 1.6em, 0.258em at the flaps' size), a split in the shade colour and Chalk letters, like the mark's 3. `--flap-radius` is a SplitFlap component token like `--flap-bg`, defaulting to the tile radius. They spell TIP, TAP, TOE, turn blank and fold away; at rest they are folded (zero width, transparent) but stay in place so they flip from blank.
- **Social preview** (`public/og.png`, 1200×630), language-neutral and centred: on the page ground (Raven Teal with the soft Raven Lift wash, upper left), the title set exactly as the header sets it: "Super" (600, 150px, Chalk) followed by the small flap drawing at 1.6em (240px) as its "3T" (its split edge to edge at this size), 0.3em after the word, with a soft Ink drop shadow, so the 3 fills the word's cap height and the T drops below the baseline; "Ultimate Tic Tac Toe" (600, 54px, Seagrass Grey) centred 44px below. No sentence, normal tracking. `og:image:alt` is "Super 3T: Ultimate Tic Tac Toe".
- **Static metadata copy:** the manifest description and the page `description` / `og:description` meta stay in Spanish, the default language. They are static texts the app cannot translate at runtime, so they are the documented exception to user-facing copy living only in the app's message catalogue.
- **Depth:** the halo, the drop shadows and the bar's light belong to the mark only; they are not a licence for glows or highlights on components (see the No Glow Rule).

## Do's and Don'ts

### Do:

- **Do** keep Apricot Flare to the departure, the single primary action and a win (about 10% of the screen at most).
- **Do** give the forced target a shape cue (3px outline and accent number tile) besides its colour.
- **Do** render every changing word or number as a row of split-flap tiles with tabular figures.
- **Do** draw X and O as round-capped SVG strokes in the same colour, distinguished by shape.
- **Do** use role tokens only in components; add a design as a theme file that overrides roles.
- **Do** keep the sentence under the departure row at a fixed three-line height so previews and refusals never move the board.
- **Do** provide an instant equivalent for every animation and honour the player's motion setting over the system one.
- **Do** use the full brand mark above 48px, the small flap drawing at 48px and below and the small flat drawing at 16px, regenerating every asset from `scripts/build-icons.mjs`.

### Don't:

- **Don't** add glows, gradients or shadows to components beyond the panel lift and the drop shadows under drawn marks and lines.
- **Don't** use Apricot Flare for focus, hover, the last move or the preview; those are Chalk or Seagrass.
- **Don't** colour X and O differently.
- **Don't** put information in the backdrop wash or torn strips; they vanish in the high-contrast design.
- **Don't** move a dashed or accent outline from platform to platform while hovering; the preview lives on the destination's number tile.
- **Don't** introduce a second typeface, raw hex values or Tailwind default palette, size or radius utilities in app code.
- **Don't** show the brand mark in the app more than once per screen or anywhere but the header lockup; its Apricot T is the One Departure Rule's only exception.
