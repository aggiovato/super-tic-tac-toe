# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences share the same game, in this order of arrival:

- **Visitors from the author's portfolio.** They open it to judge craft: rules engine, opponent,
  interface. They give it seconds, often on a phone, and must understand what they are looking at
  without instructions.
- **Friends and family.** Casual games on one shared phone or against the computer. Most have never
  heard of Ultimate Tic Tac Toe and expect to play at once.
- **Players in general (later).** People who come back: three opponent levels, stats, tactical
  challenges and, in later phases, private online rooms and accounts.

All three start the same way: someone who does not know the variant, on their first turn.

## Product Purpose

Ultimate Tic Tac Toe: a 3×3 board where every cell is another tic tac toe, and the cell you play
decides which board your opponent must play next. The product exists to make that relation
obvious. During the first turn a newcomer should be able to answer "where can I play?" and, after
placing a piece, "why does my opponent have to play there?".

Success: a newcomer finishes a game without help; a returning player perceives the difference
between opponent levels; a portfolio visitor sees a finished, coherent piece of work.

## Positioning

The forced-target rule is the whole game, and this product is built around showing it: the same
0–8 numbering on both levels, the cell just played and the board it sends to always readable
together. It runs fully locally (two people on one device or against the computer), works offline
as a PWA in a later phase, and only then adds online play.

## Operating Context

- Pass-and-play: two people hand one phone back and forth, in portrait, often one-handed.
- Desktop browser with mouse or keyboard, enough room to play directly on the full board.
- Against the computer: the opponent "thinks" for up to a fraction of a second; the board stays
  readable and the global view and settings stay reachable meanwhile.
- Short sessions: a game is 20–60 moves; rematches are frequent.

## Capabilities and Constraints

- Delivery order: local two-player game → opponent with beginner, intermediate and advanced levels
  plus a short tutorial and a tactical challenge → local save, history and score (local MVP) →
  offline PWA → private online rooms by invitation → accounts.
- Rules: `rulesVersion 1` as implemented in `src/engine/super-3t/core/` (see `.claude/rules/super-3t.md`). A
  drawn board is neutral and there is no tie-break by counting boards.
- UI copy in **Spanish and English** from the first interface, with internationalization in place
  from phase 2. The default language follows the browser. The i18n mechanism is still undecided.
- Mobile narrow screens: choose a mini board on the global view, play on a zoomed view, with touch
  targets of at least 44 × 44 CSS px. Desktop may play directly on the full board.
- Undecided: how much zoom helps on mobile, what animation length feels natural, and whether a
  global thumbnail lets players anticipate the next turn. The phase 2 prototype decides them.

## Brand Commitments

Binding unless the author changes them later:

- **Name:** Super 3T (Tip, Tap, Toe). Each time a player wins a board, two flap tiles unfold
  after the T, spell IP, AP and OE, then fold away; at rest the name is just Super 3T.
- **Palette:** Raven Teal `#16292B` (about 60 %: background, surfaces, space between boards),
  Seagrass Grey `#9FB3AB` (about 30 %: text, X/O, strokes), Apricot Flare `#FF8A1F` (about 10 %:
  forced target, action focus, primary control). Only derived tints and shades are added.
- **Type:** Barlow Semi Condensed, tabular figures for the score, system fallback, served locally.
- **Direction:** dark Flat Design 2.0 with an arcade accent reserved for pieces and wins.

## Evidence on Hand

None yet: no logo, illustrations, screenshots, testimonials or player data. Do not invent
players, quotes, ratings or download counts.

## Product Principles

1. **The target is the hero.** Where the next move may go, and why, is the most visible thing on
   screen at every moment.
2. **Learnable on the first turn.** No manual before playing; the interface teaches through what
   it highlights and the short messages it shows.
3. **The engine is the truth.** The interface only presents positions the engine accepted; zoom,
   animation and focus never change the game.
4. **One game everywhere.** The same game by touch, mouse and keyboard, in portrait phones and on
   desktop, with or without motion.
5. **Earned spectacle.** Calm by default; the arcade accent is spent on closing a board and winning
   the game.

## Accessibility & Inclusion

- WCAG 2.2 AA. Colour is never the only signal: the forced target also has shape or text, and X
  and O differ by more than colour.
- One keyboard entry point to the board with arrow keys, Enter/Space and a way back to the global
  view; focus stays predictable after a board closes.
- Turn and target announced once in a status region; cells named by board, cell and occupant.
- `prefers-reduced-motion` switches framing instantly; the game works with zero-length animation.
