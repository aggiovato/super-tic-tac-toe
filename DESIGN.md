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
  how-to-play-ticket:
    backgroundColor: '{colors.raven-deep}'
    textColor: '{colors.seagrass-grey}'
    rounded: '1rem'
    padding: '2rem 1.25rem 1rem'
    width: 'min(26rem, 100vw - 2rem)'
  how-to-play-ticket-wide:
    padding: '2rem 2rem 1rem'
  how-to-play-title:
    textColor: '{colors.chalk}'
    typography: '{typography.title}'
  how-to-play-rule:
    textColor: '{colors.chalk}'
    typography: '{typography.body}'
  how-to-play-mini:
    backgroundColor: '{colors.raven-teal}'
    textColor: '{colors.seagrass-dim}'
    size: '2.9rem'
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

- **Apricot Flare** (apricot-flare): the departure. The forced platform's border and its flap number, the accent characters in the departure row, the primary button, the winning line and the winner's large marks. Also the text selection fill, the T of the brand mark and the chat's unread dot (see the exceptions under the One Departure Rule). Nothing else. The how-to-play ticket spends it on the same three things in miniature: the departure in its drawings, a win strike and its one primary action.

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

**The One Departure Rule.** Apricot Flare marks where the next move may go, the one primary action, and a win. A second use of orange on a screen is a bug. Two sanctioned exceptions, both by the owner's decision. The Apricot T of the brand mark in the header lockup, because the mark is drawn in the win accent and lives in the header; the mark appears once per screen, never inside the board, the departure row or a control. And the unread dot on an online room's chat button: a small Apricot disc ringed in the ground colour, shown only while the rival's messages wait unread, because a message waiting is a call to act that must read at a glance over the game. Only the dot is Apricot, never the button, the glimpse or the bubbles. Nothing else may cite either to add orange.

**The Shared Ink Rule.** X and O are both drawn in Seagrass Grey (Chalk in high contrast). Shape tells them apart, never colour; the accent is reserved for the departure. One exception, chosen by the owner: Dots and Boxes gives each player an ink derived from the palette, Verdigris `#7cc4b4` for X and Sand `#d9b98f` for O (brighter in high contrast), because its lines carry no shape; the X or O in every closed box still tells players apart without colour. A second exception, also the owner's: Ship Sink gives a hit an ink of its own, Sand (`--color-hit`: `--ref-sand-300` `#d9b98f`, `--ref-sand-200` `#ecd0a6` in high contrast), on the hit cross, hit coaches, the pips of sunk trains and the outcome word in the departure row; the cross shape still tells a hit from a water dot without colour. Sand marks a hit (and a shot still waiting for its answer), never the next shot or a win: those stay Apricot.

**The Focus Is Not The Accent Rule.** The keyboard focus ring is Chalk, 3px, offset 3px; never Apricot Flare, so focus can never be mistaken for the forced target.

**The Role Name Rule.** Code uses role tokens (`--color-target`, `--color-surface-panel`), never hue names or raw values; a new design is a new theme file overriding those roles (see `.claude/rules/design-tokens.md`).

## Typography

**Display Font:** Barlow Semi Condensed (with ui-sans-serif, system-ui fallback), served locally
**Body Font:** Barlow Semi Condensed
**Label/Mono Font:** none distinct; tabular figures (`font-variant-numeric: tabular-nums`) are set on the root

**Character:** a single condensed grotesque doing the job of station signage: bold and tight on the flaps, plain and readable in the explanatory sentence. Weights in use are 500, 600 and 700 only.

### Hierarchy

- **Flap** (700, fluid 36–60px, line-height 1): the departure row. Each character sits in its own tile.
- **Score** (700, 36px, line-height 1): series score digits, also flap tiles. Each entry (a player, the draws where a game can end in one) takes an equal column, its name and digits centred in it. Under the player to move, a turn tag in every game: a departure-board tile (Raven Lift, the flap's hairline split, bold Chalk caption capitals, as the library's EN JUEGO) reading "TU TURNO" / "SU TURNO" against the computer or online, "JUEGA" between two people on one device; its slot is kept on both players so the turn never shifts the score, and no tag shows while both may move at once.
- **Title** (600, 24px, line-height 1.15): the masthead name only.
- **Body** (500, 18px, line-height 1.4): the "why" sentence under the departure row (max 60ch, fixed three-line height so a replacement never moves the board), buttons (600, primary 700), settings choices.
- **Label** (600, 14px, line-height 1.3): score labels, settings legends (700, Chalk) and field captions, small buttons.

Platform numbers and cell numbers scale with their container (platform number clamp 14–24px, 20–36px on an open board; cell hint numbers clamp 10–18px, bold).

### Named Rules

**The Tabular Everywhere Rule.** Every digit on screen is tabular so flaps and scores never shift width while cycling.

**The Sentence Case Rule.** Copy is written in sentence case at normal tracking. Capitals appear only as characters on flap tiles, where the board itself is the uppercase device.

## Layout

One screen, no scroll during play on most phones. On an upright phone the arena keeps at least the height its board needs at the full width (each game says how much); upright phones up to 860px tall tighten what surrounds it (half the gaps and block padding, departure tiles a step smaller), so on a short phone the page scrolls a little rather than shrinking the board. Phones use a single column (masthead, departure row with its sentence, the board arena flexing to fill, then score and actions in the thumb zone) inside a 16px gutter. From 48rem wide in landscape (aspect at least 5:4) the page becomes two columns: a side column of 18–26rem for masthead, departures, score and actions, and the board on the right at full viewport height; gaps and block padding open up to 32px. The page is capped at 80rem and centred. From 87.5rem wide in landscape the game library joins as a column on the left (22rem, before a hairline rule; narrower windows reach it from the games button) that holds the page's left edge, and the page has no cap: the game, its side column and a board area of at most 42rem (the largest board), is centred in the room left on the right, so the space either side of it stays even, with 32px between the side column and the board where room is tight, opening up to 96px on big screens (`clamp(32px, 5vw − 2rem, 96px)`); it folds to a 2.75rem rail with only the games button, remembered with the preferences, and then the board takes the room back on mid-size screens. Folding animates the column's width through the grid's own columns (only the library's track changes, so they interpolate): 240ms folding, 520ms unfolding, with the out easing. The cards keep their width, so the column's edge clips them instead of squeezing them: folding, they fade at once (150ms) and drift 1.5rem left; unfolding, they fade in after 150ms and slide back from the left, as if the column uncovered them. The heading stays in the flow and fades under the edge, so the fold button travels with the edge instead of jumping. Open, the cards start 16px under the heading. On these screens the page's side padding opens to 32px, as wide as its top and the gap between its columns.

The board sizes from its arena as a size container. Every platform's 3×3 grid is square, so a platform is a card one number row taller than it is wide, and the board is three number rows taller than wide: full width on phones, as wide as the height allows on short screens, and never past 42rem on large screens (the classic board stops at 34rem, Dots and Boxes at 36rem, Ship Sink's waters at 40rem when stacked on phones and 44rem in the wide arena). The whole board sits centred in its arena both ways, as the other games' boards; the zoomed view on narrow screens fills it. Platforms sit on a 3×3 grid with a fluid 8–16px gap; inside each, the 3×3 cells are separated by 2px gaps through which the grid line colour shows. On narrow screens a single platform opens zoomed (its grid square too) with a global thumbnail above it that leads back to the full board. Movements run one after another, never crossing: after a move the open board shrinks into its slot and the other boards fade in as it lands; after a beat, the others fade out and the forced board grows from its own slot (520ms, eased in and out). A closed board draws its large mark and line once, when it closes; views rebuilt later show them already drawn.

Spacing rhythm is 4px-based: 8px inside a block, 16px between blocks, 32px between sections. Touch targets are at least 44×44px.

## Elevation & Depth

Components are flat; depth is tonal. The ground is Raven Teal under a fixed radial light (Raven Lift, top left) and a fixed vignette (Ink, bottom right), with two softened torn-paper strips (Seagrass at very low opacity, 0.2 layer opacity, 0.6px blur) running off the page edges behind everything. Panels sit one tone darker than the ground and lift with a single soft shadow. The only other shadows are drop shadows under drawn marks so a line can pass beneath them.

### Shadow Vocabulary

- **Panel lift** (`box-shadow: 0 0.375rem 1.25rem -0.25rem var(--color-shade)`): every full-size platform over the page. Not on thumbnail platforms.
- **Mark drop** (`filter: drop-shadow(0 0.25rem 0.5rem var(--color-shade))`): the large X, O or draw mark over a closed board.
- **Line drop** (`filter: drop-shadow(0 0.125rem 0.375rem var(--color-shade))`): strike lines.
- **Ticket lift** (`filter: drop-shadow(0 -0.375rem 1.5rem var(--color-shade))` as a bottom sheet on phones; `filter: drop-shadow(0 0.375rem 1.25rem var(--color-shade))`, the panel lift's offset and blur, when centred from 35rem): the how-to-play ticket only. A filter on the dialog rather than a box-shadow on the card, because the card's notch mask would cut a box-shadow.

### Named Rules

**The Atmosphere Carries No Information Rule.** The wash and the torn strips are decoration only. The high-contrast design removes them (backdrop opacity 0, no glow), and nothing is lost.

**The No Glow Rule.** No component glows. State is shown by borders, rings and tone; the only spectacle is a win (orange line and marks). One transient exception, by the author's decision: a board closing crackles once, an uneven chalk flicker of its outline (`--color-spark`) with a brief shake (about 600ms), and a won game flashes its three winning boards three times in the accent (about 1s). Both are skipped with reduced motion; nothing stays lit.

## Shapes

Gently rounded, and smaller parts get smaller radii: cells 2px, flap tiles and rings 4px, platforms 8px, controls and fields 12px, radio dots full pill. Borders are the main state vocabulary: hairline 1px (sheet edge), line 2px (grid gaps, buttons, fields, cell rings), emphasis 3px (platform outlines, focus ring). Every flap tile is cut by a hairline split at its middle in the ground colour. Marks are round-capped strokes: X and O drawn in SVG with round caps and joins, never type glyphs; the large closing mark sits on a halo in the board colour.

## Components

### Buttons

One family on a native `<button>`: tactile, plain and condensed.

- **Shape:** gently rounded (control radius), 2px border, min height 44px, 16px inline padding. On phones (under 48rem) quieter: 38px tall, 12px inline padding, the label a step smaller, with an invisible band keeping the 44px touch target.
- **Primary:** Apricot Flare fill, Raven Teal text, weight 700. At most one per view (Rematch when a game ends). Hover draws a 2px inset ring in Raven Teal.
- **Secondary:** transparent with a Seagrass Dim outline and Seagrass text (Undo, offered only against the computer at its first level); hover fills Raven Lift.
- **Quiet:** text only with 8px inline padding (Settings, close); hover fills Raven Lift.
- **Small:** label size text.
- **Disabled:** transparent, Raven Lift border, Seagrass Dim text, not-allowed cursor.
- **Focus:** the global Chalk ring.

### Inputs / Fields

- **Text field:** Raven Teal fill on the panel, 2px Seagrass Dim border, control radius, 44px tall, Chalk text at body size.
- **Radios and checkboxes:** drawn from tokens, 20px, 2px Seagrass Dim border on Raven Teal; a Chalk dot or check scales in when checked and the border turns Chalk; hover strengthens the border to Seagrass Grey.
- **Segmented choice:** a `ChoiceGroup` with `layout="segmented"` sets short options side by side on one track: Raven Teal, hairline Seagrass Dim border, control radius, 4px inset (`--segment-inset`). Each segment is at least 44px tall, caption size at weight 600, Seagrass Grey; the chosen one is raised in Raven Lift with Chalk text. The native radio stays underneath, invisible and covering the segment, so arrows, labels and screen readers work as for any radio group; its focus draws the focus ring on the segment.

### Settings Sheet

A native popover. On wide screens a full-height sheet on the right (up to 24rem) with a hairline left edge, sliding in from the right over the frame duration; under 35rem a departure ticket like the how-to-play one: a Raven Deep card of steady height (85% of the viewport, at most 44rem, so switching tabs never makes it jump) held 16px off the sides and the bottom, twice the panel radius, the upward ticket lift and the Ink veil; its head is the stub, torn off along a 2px dashed Raven Lift perforation with a half-circle notch on each side (placed at the head's height by `trackTear` in `@ui`). It rises from below over the zoom duration. Both use the out easing and the 70% Raven Teal scrim fades with them; closing runs the same motion back, and reduced motion drops it.

- **Head:** the title, the close button and two ARIA tabs, "Game" and "App" (es "Partida", "Aplicación"): body size, weight 600, Seagrass Grey; the selected tab is Chalk with a 3px Chalk underline. Arrow keys, Home and End move between them. The head stays put above a hairline; only the section below scrolls.
- **Sections:** the sheet is shared by every game (`SettingsSheet` in `@layout`). Game opens with the game's own settings (projected: for Super 3T, "How to play", which hides the sheet before reopening the ticket so the two modals never stack, "Tactical challenges", hints and opening the forced board), then who plays (mode and level, saved per game), player names and New series. App holds language, motion and design. Choices with short labels use the segmented choice; groups are 32px apart, each under a Chalk legend. A 2.5rem fade at the section's foot shows that more follows, and goes once the end is reached (scroll-driven; without support there is no fade). Touch screens hide the section's scrollbar.
- **Phones:** a 40×5px Seagrass Dim grip tops the sheet, and the head is its drag handle: dragging down follows the finger; releasing past a quarter of the sheet's height, or with a quick flick, closes it, otherwise it springs back (`swipeToClose` in `@ui`).
- **Scrollbars:** across the app, thin Seagrass Dim rails on a clear track (`scrollbar-color`, with WebKit parts where it is unsupported).

### Opponent Levels

The computer opponent is named after its level, a rank that says how strong it plays: Novato, Veterano, Maestro (Rookie, Veteran, Master). The name replaces "Rival" wherever the opponent is named: the score, the status sentences, the line and cell labels and the history. Beside its name in the score and in the settings' level choice, `LevelBars` (`@ui`) shows the level as three rising bars, filled up to it (one, two or all three), in the text's own colour: shape, not colour, so it never competes with the player inks or Apricot. Screen readers hear the level in words after the name ("Maestro, Avanzado").

### Update Notice

When a new version of the installed app is ready, a quiet ticket offers it in the page's flow: under the save notice in the controls column (the thumb zone on phones); never floating over the controls. Raven Deep with a hairline Seagrass edge, the panel radius and lift, a caption-size Chalk sentence and one secondary "Actualizar" button, which reads "Actualizando…" while it switches. It never shows while a save is under way; if the game could not be saved, the sentence warns that the last moves would be lost and the button reads "Actualizar igualmente". A broken cached version reloads by itself, without asking, once no save is under way. It rises in once (240ms), not under reduced motion.

### Page Changes

Moving between pages (a game, a challenge, another game; the history is a ticket over its game, not a page change) uses the router's view transitions: the page's content fades out in 150ms and the new one fades in with a 0.75rem rise in 240ms, while the torn-paper backdrop, the same on both pages, stays put. The named layer (`view-transition-name: page`) is each page's full-width host, never its inner column (80rem in a game), so neither snapshot is stretched into the other's box; the library aside is a layer of its own (`library`) and stays still between games. A game arrives already in place: its route reads the saved game before the page renders (`preloadMatch`), and the other games' code is preloaded in the background, so a first visit does not wait for it. The settings sheet and the games dialog slide in with their backdrop fading. Every one is skipped under reduced motion.

### Masthead on Small Phones

Below 30rem the masthead's buttons (Juegos, Historial, Ajustes) keep only their icons, their names left for screen readers, so the brand's TIP·TAP·TOE flaps have room to unfold.

### Game Library

The family of games (`GameLibrary` in `@library`), the one way to switch games. On wide landscape screens it is the page's left-hand aside under a "Juegos" heading, with a fold button (a panel icon; "Ocultar juegos" / "Mostrar juegos", `aria-expanded`); elsewhere a "Juegos" button in the masthead opens it in a native modal dialog, a right sheet on tablets and on phones the same departure ticket as Settings (inset card, notched perforation under the "Juegos" head, Ink veil) (focus trapped, Escape or a backdrop click closes it, following a game closes it too). Super 3T, the main game, leads as a banner: a wider preview, the name at title size and a one-line blurb (no tag above the name: size carries it). The other games follow as cards (preview, name, blurb), two side by side under the banner in both the aside and the dialog (from an 18rem container). Every preview is a drawn SVG scene of the game mid-play on the done surface (Super 3T with closed boards and the target board, the classic game with its winning strike, Dots and Boxes in the player inks, Ship Sink's waters with water dots, Sand hits, a wreck and the Apricot aimed cell), so it follows the design and high contrast. Cards are links in Raven Deep with a hairline Seagrass Dim edge, Raven Lift and a Seagrass edge on hover, the Chalk focus ring; the game on screen has a Chalk edge, `aria-current="page"` and an "EN JUEGO" tag leading its text: a departure-board tile (Raven Lift, the flap's hairline split, bold uppercase Chalk caption). Every game is saved, so switching never asks.

### Online Panel

An online game's room lives in the masthead: a quiet "Sala" button, before the page's own actions, with one presence dot (signal green, `--color-online`, inside a soft halo of the same green while both players are connected; a Seagrass ring otherwise: the shape still tells them apart, never the accent), named for screen readers by the room's note ("Sala: todo en orden", "Sala: Sin conexión. Reintentando…"). It opens the whole panel below as a popover under the masthead at the right edge (Escape or a tap outside closes it). On wide screens the panel also shows in the page's own flow, under the score, while something needs saying. On phones and narrow screens the button is the room's only voice: the page shows no panel, a passing state (reconnecting, the rival gone) is the dot and the button's name, and the popover opens by itself for something to act on (the link to pass on when the room is created, a problem with the room, a room left), closing again once it is met.

An online game (`/<game>/online/:room`) adds one panel to the controls, in the Update Notice's language: Raven Deep, a hairline Seagrass edge, the panel radius and lift, caption size. Its head lists both players' presence, "Tú" and "Rival" in semibold Chalk with a word after them, and holds the quiet way out on the right ("Salir de la sala", which replaces its history entry so the back button skips the room). Presence is a shape first: a filled signal-green dot connected, a Seagrass ring without connection, a dashed ring for a rival not in yet. One Chalk sentence follows only when something needs saying (reconnecting, the rival gone, a problem with the room); while the rival is on the way, the room's link sits in a field with "Copiar enlace" (or "Compartir" where the device shares), the one Apricot action on the panel. Coming back to a room left inside the app (the back button, the link again) never reconnects silently: the panel says "Saliste de esta sala." and offers "Volver a la sala" (secondary). Online there is no undo, no save line and no setup in Settings; the score names the players "Tú" and "Rival", and sentences use the name typed on this device or the symbol.

### Room Chat

An online room adds a chat between its two players: free text, plain, never rendered as markup. Its button is a round Charcoal (raised surface) disc with a hairline edge and the panel lift, holding a line icon of a speech bubble; it floats at the bottom right of a phone above the controls (the page keeps room for it at its end) and sits in the side column's flow under the score on wide screens. While the rival's messages wait unread, an Apricot dot sits on its top right corner, ringed in the ground colour (the One Departure Rule's second exception); its name says the count ("Chat, 2 sin leer").

A message that comes in while the chat is closed is glimpsed over the button for about four seconds: a small Raven Deep card with a Seagrass hairline, caption size, two lines at most; a tap opens the chat, and it is announced politely to screen readers. Then only the dot remains.

The conversation is a tall How-to-play Ticket: the whole screen inside the gutters on phones, a tall centred card on wide screens. Its head holds "Chat" and a quiet "Cerrar"; the bubbles run oldest first, the rival's on the left on the ground colour with a hairline, this player's on the right on Charcoal, each with its time in caption below, the corner nearest its writer squared. A message on its way is dimmed with "Enviando…"; one the room did not keep says why and offers "Reintentar" and "Descartar" (quiet). The composer sits at the tear line: a field that grows to a few lines (Enter sends, Shift+Enter breaks the line), a countdown of characters left from 40, and "Enviar", the ticket's one primary action. The keyboard resizes the page on phones, so the composer stays above it.

### Save Notice and History

- **Save notice:** a caption line under the game's actions, reserved so the controls never jump. It reads "Saved" (es "Guardado") with a check icon once the device confirms a save, and "Saving…" meanwhile. A failed save turns it into a notice: Chalk text behind a 3px Chalk left rule (the challenge attempt line's language), with "Try again" (secondary, small) for a full disk or a failure and "Reload" when another tab moved the game on. A browser that keeps nothing says so once.
- **History button:** a quiet small button with a history icon, "History" (es "Historial"), beside Settings in the masthead of every game.
- **History page** (`/<game>/history`): the masthead with "Back to the game", the title "Super 3T history" (es "Historial de Super 3T"), then a table of results against the computer by level (Wins, Draws, Losses; hairline rows, figures in semibold Chalk, tabular), the count of games for two people, and the ten latest finished games as hairline rows: the result in semibold Chalk on the left ("You won", "You lost", "Draw", or "Player 1 wins"), then the setup and, in caption size, the date and the number of moves. No accent colour: the page reports, it does not signal.

### Dots Board

Dots and Boxes (`/dots`) uses the shared game page. The board is one square platform in Raven Lift, as big as the arena allows (at most 36rem), with small Seagrass dots (mid-tone on purpose: bright discs at the crossings of a dark grid make the eye see dark dots flicker, the scintillating grid) and, between them, every line still to draw as a thin dotted Seagrass Dim guide, so the board reads as dots waiting to be joined. A tap or click anywhere on the platform, its margin included (a finger aiming at an edge line often lands just outside the dots), draws the line nearest the pointer, within half a box (thin lines would otherwise have overlapping hit areas at the dots), and that line is previewed in dotted Chalk under the pointer; each line is also a native button for the keyboard (one tab stop on a free line, arrows, Home and End, Enter) with the Chalk focus ring. A drawn line takes its player's ink (Verdigris for X, Sand for O) with the line drop shadow and grows from its first dot to the second; the last line wears a hairline Chalk ring. A closed box turns into a tile, as a closed board in Super 3T: the darker done surface tinted 24% with its player's ink, set 7% inside its lines with the panel lift, under the player's X or O drawn on in the same ink with a halo of the tile's colour, and a brief Chalk spark; at the end, as in Super 3T, the board steps back to the done surface and the winner's figure shows in Apricot: each winning box drops its tile and draws its mark and all four sides in Apricot, whoever drew them, while the loser's boxes and lines step back (a draw dims nothing). When the winning line has just been drawn, each winning box flashes three times with Super 3T's win spark: an Apricot outline with its glow, after the closing spark. The departure row is the box score: each player's symbol and two-digit box count on flap tiles in their ink ("x 03 · 02 o"); the player who waits steps back to 40% opacity, so the side at full strength is the one to move. At the end it reads "x GANA" in Apricot, as in Super 3T; while the game goes on the row has no Apricot. One sentence says what the last line did, and screen readers hear it with the box count. The series score sits below in a compact form. Settings add the board size (3×3 or 5×5 boxes) and the game's own how-to-play ticket with four rules drawn in the players' inks; the history keeps one results table per board size. Motion is off under reduced motion.

### Classic Board

The classic tic tac toe (`/classic`) uses the same page as Super 3T (`GameLayout` in `@layout`: masthead, status row, arena, controls) and the same pieces: the departure row reads "X → PLAYS" (es "JUEGA") and turns to the result like Super 3T's, one sentence names the last move, and the score and actions are shared. The board is one large platform, square and as big as the arena allows (at most 34rem), in Raven Lift with the shared grid lines, cells (`BoardCell`), flap marks and the round-capped Apricot strike line through the winning line's centres; a finished game steps the board back to the done surface. Arrow keys move a single roving cell, Home and End jump to its corners.

### Ship Sink Board

Ship Sink (`/fleet`) uses the shared game page against the computer or online only: the fleets are hidden information, so there is no two-people mode on one device, and the actions drop the Undo row (as online play does). The game has no draws, so its series score shows the two players only.

- **Waters:** a 10×10 board of Raven Deep cells (cell radius) on 2px gaps, standing on a Raven Lift platform with panel padding, the panel radius and the panel lift, as the other games' boards. Rows A–J and columns 1–10 run along the top and left in bold caption-size Seagrass (4.5:1 on the platform: the coordinates are how a cell is found); the aimed cell's row and column labels turn Apricot. Each cell is a native button, one in the tab order: arrows move, Home and End jump to the corners, Enter, Space or a tap picks; the cursor is a crosshair and hover fills Raven Lift (never over a ship). A tap on a cell already fired at is refused in the sentence, never silently.
- **Marks:** water is a small Seagrass Dim dot (22% of the cell); a hit is a round-capped Sand cross; a sunk ship's cells drop to the done surface (Raven Deepest in high contrast) under a 2px Chalk outline around the whole ship, its crosses still in Sand. The water around a ship, where no other ship may go (ships never touch), is a soft diagonal hatch of Seagrass Dim at 30%: a zone, not a mark, so it never reads as a shot. It shows around sunk ships and, while placing, around every ship. A shot sent online and not yet answered pulses a thin Sand ring.
- **Aim:** the aimed cell carries a 3px Apricot ring at tile radius, the shape cue besides the colour; a second tap on it, or the Fire button, fires. The aimed cell, its labels, Fire and the win are the screen's only Apricot.
- **Own waters:** your ships are Seagrass Dim capsules (pill radius) under the marks, the cells over them see-through; the rival's last shot at you wears the shared 2px Chalk last-move ring. In battle these waters are a compact thumbnail (1px gaps, no labels, hairline wreck outline and ring).
- **Trains:** each fleet is a row of trains, one per ship, each a run of small flap coaches (cell radius, the flap's hairline split in the ground colour, 2px apart). The rival's coaches are blank Raven Lift with a 1px Seagrass Dim edge until the ship sinks; your coaches are Seagrass Dim and turn Sand when hit. A sunk train is the strongest state: every coach Sand inside a 2px Chalk outline, as the wreck is outlined on the board, so a sunk fleet never reads calmer than a hit one. Both fleets read as two equal rows of one board: the name in caption, its count afloat in bold Chalk caption at the row's end ("3 a flote"), the trains on one line beneath, so the two compare at a glance.
- **Departure row:** it announces the shot: the cell and the outcome ("F4 TOCADO"; who fired is the sentence's, a symbol here read as a hit's cross), the hit or sinking word in Sand, water in plain flaps; the end reads "VICTORIA" in Apricot or "DERROTA" in plain flaps; placement reads "FLOTA". Tiles shrink to fit up to twelve in the column. The sentence below is fixed at two lines; when the turn comes back after the rival's miss it says both ("B2: agua. Novato dispara a B4: agua. Tu turno."), and before the first shot of a rival who fires first, "Dispara Novato: espera tu turno."
- **Phones:** the rival's row (name, ships afloat, trains on one line), the enemy waters at the full width, then the quay, the same at every width: the own-waters thumbnail (4.75rem) spanning two rows, your row beside it read like the rival's, and under it at the right the one primary action in one slot (Fire while the game goes on, Rematch once it ends, so nothing moves at the result). Coaches size themselves so a whole fleet keeps to one line. From 48rem landscape (5:4) the side column reads status, the two fleet rows, your waters (an 8.5rem thumbnail captioned "Tus aguas"), and the score; the one primary action (Fire, then Rematch) stands right under the board, at its right edge. The waters take the arena's height less that row, at most 44rem.
- **Magnifier:** the own-waters thumbnail is a button (zoom-in cursor, `aria-pressed`) with a small lens badge just past its bottom-right corner, covering no cell (Raven Lift disc, a 2px ring in the ground colour, the lens in Chalk); the rival's last shot on it wears a full 2px Chalk ring. A tap swaps the boards: the big board shows your waters under a header ("Tus aguas" in bold Chalk caption, a quiet "Volver a las aguas enemigas"), the thumbnail the enemy's; on phones the header takes the rival row's place. Nothing is fired meanwhile, the aim waits for the way back, and a new game forgets the swap.
- **Placement:** the fleet arrives placed at random. Your waters fill the arena with the hatch around every ship; tapping a ship selects it (Seagrass Grey capsule) and a tap elsewhere moves it there, keeping its orientation: its bow on the tapped cell, or slid back from the edge so it ends on it (a tap on J10 lays a horizontal carrier on J6–J10). Right under the board, a caption-size note names the chosen ship, or the problem in Chalk, then the actions: Rotate and Shuffle (secondary) on the left, Confirm fleet (primary) on the right.
- **How to play:** the shared ticket with four rules drawn in the board's own marks: Seagrass Dim capsules, a water dot beside a Sand cross, a Sand cross beside the Apricot aim, a wreck under Apricot crosses for the win.

### Challenge Panel

The tactical challenge (`/challenge/:id`) is the game screen around a prepared position, never a separate look: the same masthead, departure row and board, with "Back to the game" (es "Volver a la partida", a quiet button with the close icon) in place of Settings, and the challenge panel in place of the score and the game's actions.

- **Picker:** a segmented choice, "Challenge" (es "Reto"), of Easy, Medium and Hard; a solved challenge reads "Easy ✓". Picking one navigates to its id.
- **Goal:** one body-size Chalk sentence: you play X and must send the opponent where any reply hands you the game.
- **Attempt line:** body size, Seagrass Grey behind a 3px Seagrass Dim left rule, reserving two lines so the panel never jumps. Going wrong (a move the opponent survives, or a missed finish) turns rule and text Chalk; solving turns the rule Apricot (`--color-win`) with Chalk semibold text. It is a polite live region; the departure row's status region still announces the moves.
- **Actions:** "Try again" (secondary) once a move is played; "Next challenge" (primary, the one Apricot action) once solved.
- **Entry points:** Settings → Game → "Tactical challenges" (a second press, "Go and leave this game", while a game is under way) and, while no game is under way, a Chalk underlined caption link at the foot of the how-to-play ticket's rules.

### How-to-play Ticket

The rules arrive as a departure ticket handed over before boarding: four lines, each beside a tiny board drawing, then the player boards the real game behind it. Never a step-by-step tour over the board.

- **Container:** a native modal `<dialog>` (the page behind is inert, focus returns where it was) over the real board, dimmed by a backdrop in the shade colour (Ink at 70%). The card is Raven Deep (`--color-surface-panel`) with twice the panel radius, Seagrass Grey text, 32px top padding, 16px bottom padding and side padding from `--ticket-pad`. When the viewport is short (max height: viewport minus 16px above and below) only its body scrolls: the tear line and the actions stay in view.
- **Notches and tear line:** both sides are cut by a half-circle notch (`--ticket-notch`, 0.65rem radius, drawn with a CSS mask that reads alpha only) at the tear line, `--ticket-tear` (4.8rem) above the card's bottom: the actions row and its padding. The tear line is a 2px dashed border in Raven Lift (`--color-surface-raised`) running the card's full width, notch to notch, above the actions.
- **Anatomy:** title (title size, weight 600, Chalk); one line of intro (caption size, 14px, line-height 1.35, Seagrass Grey); an ordered list of four rules in the order a newcomer needs them (winning a small board, how your cell picks the opponent's board, where you may play, winning the game), 16px apart, each a two-column row (the drawing at its own width, then the text in body size, Chalk), 16px gap (`--spacing-stack`), vertically centred, so single drawings sit right beside their text and only the second rule's text starts after its pair of boards and arrow; then a caption-size note that the flap row always says whose turn it is and where; then the actions row: a quiet "Skip" (es "Saltar") at the left and the Apricot primary "Play" (es "Jugar") at the right.
- **Mini-board drawing language:** each drawing is a 2.9rem SVG (30-unit box) of the board's own parts, never a new illustration style: a Raven Teal tile (`--color-surface`, rx 4) with a 1-unit outline and a 3×3 grid inset 5 units, both in the board's line colour (Seagrass Dim, `--color-line`). The departure is the board's forced state: a 2.4-unit Apricot outline (`--color-target`) and a bold Apricot number top left. The played cell is a 7.5-unit Chalk square (rx 1.4) carrying, centred in Raven Deep at 6.5 units so it reads at 1x, the same number as the board it sends to; an arrow (round-capped Seagrass Grey stroke, 0.7rem) leads from it to that forced board. A small board won is three round-capped Chalk crosses across its middle row, struck by a thin Chalk line at 60%. A game win is a round-capped 2.6-unit Apricot strike (`--color-win`) across the grid. The drawings are decorative (`aria-hidden`); the sentence carries the rule.
- **Colour:** the ticket's only Apricot is the departure in its drawings (as on the board), the win strike and the one primary action, all within the One Departure Rule. Everything else is Raven, Seagrass and Chalk.
- **Placement:** under 35rem, a bottom sheet: full width minus the 16px gutter, resting 16px above the bottom edge, with the upward ticket lift, side padding 1.25rem so the rules keep their measure. From 35rem, centred on the page, about 26rem wide, side padding 32px (`--spacing-stack-loose`) and the downward ticket lift.
- **Motion:** opening, the ticket rises 2rem and fades in over the zoom duration and easing (`--duration-zoom`, `--ease-zoom`); the backdrop fades in over the same duration with the out easing. Closing runs it back quicker, over the frame duration (`--duration-frame`), as every exit in the app; the native dialog stays drawn until then (`transition-behavior: allow-discrete`). The history's tickets move the same way, the second a beat later, and the game's route comes back only once they have left. Off under reduced motion (the player's motion setting overrides the system's).
- **Focus and dismissal:** focus lands on the title (`tabindex="-1"`, no ring), so it is read first and no ring sits on a button nobody chose. Escape, Skip and Play all close it, and any close marks it seen.
- **First visit and entry point:** the game page opens it after its first render while the player's preferences say it has not been seen (`tutorialSeen`, persisted with the other preferences); after that only the settings sheet's "How to play" button reopens it.

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
- **Do** draw any rule or help illustration in the board's own language: a Raven Teal tile with a Seagrass Dim grid, the departure as the forced board's Apricot outline and number, the played cell in Chalk, a win as an Apricot strike.
- **Do** keep Sand (`--color-hit`) to hits in Ship Sink: the cross, hit coaches, sunk trains' pips and the outcome word.
- **Do** show where a ship may not be (the no-touch water) as the soft hatch, a zone, and every shot as a mark (dot, cross).

### Don't:

- **Don't** add glows, gradients or shadows to components beyond the panel lift, the how-to-play ticket's lift and the drop shadows under drawn marks and lines.
- **Don't** use Apricot Flare for focus, hover, the last move or the preview; those are Chalk or Seagrass.
- **Don't** colour X and O differently.
- **Don't** put information in the backdrop wash or torn strips; they vanish in the high-contrast design.
- **Don't** move a dashed or accent outline from platform to platform while hovering; the preview lives on the destination's number tile.
- **Don't** introduce a second typeface, raw hex values or Tailwind default palette, size or radius utilities in app code.
- **Don't** show the brand mark in the app more than once per screen or anywhere but the header lockup; its Apricot T is one of the One Departure Rule's two exceptions (the other, the chat's unread dot).
- **Don't** use the hatch for a shot, or water dots for the no-touch water; and don't spend Sand on the aim or a win, nor Apricot on a hit.
