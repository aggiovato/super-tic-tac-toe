---
version: 1
slug: 'src-app-game-ui-game-page-ts'
primary_target: 'src/app/game/ui/game-page.ts'
related_targets: []
---

# Game screen

Scope: the playable game route (two humans on one device in phase 2; the opponent joins in phase 3).
Visitor mode: experience. The work itself leads from the first viewport: the board is playable at once.

Audience and job: a newcomer on their first turn (portfolio visitor, friend, returning player) must
see where they may play and, after playing, why the opponent must play where they do.

Free choice, the opening included, shows a neutral light outline on every playable card (user:
"las cards tenían todas como un borde clarito").

Decided after the first critique (22/40): boards numbered 1–9 for players; mini boards are
platforms with a flap number; cells are flap tiles; flap rows cycle through the drum to their word;
narrow screens close the open board into the grid after a move, pause, then open the forced board
from its slot (view transitions); win lines are drawn on; desktop uses two columns with the board
at full height. Players can rename themselves, switch language, motion, auto-open, hints and the
high-contrast design.

## Direction contract

THESIS: every move is a departure. The cell you play announces, on a split-flap board, the board
your opponent departs to next. Refuses the category default of a neutral 9×9 grid with a glowing
highlight and a turn bar.

OWN-WORLD: Raven Teal ground; flap tiles in a darker teal with a hairline split across the middle;
Seagrass Grey flap characters and both X and O strokes (user decision); Apricot Flare only
for the departure (the forced board, its number and the primary control). Barlow Semi Condensed
bold with tabular figures on every flap. Mini boards are numbered platforms 1–9 (as shown to
players); the number is a flap tile on the board. Flat surfaces and components; the page ground
carries a soft light-and-shade wash and two softened torn-paper strips from the owner's artwork
(user decision, 2026-11-18/19: "diseños que den vida al fondo… sombreado… desgarros"). No glow on
components except a win and the brief electric spark of a board closing (user decision, 2026-11-19).

STORY: the player reads the flap row ("O → 2"), sees platform 2 lit, plays a cell, watches the row
flip to the board that cell sends to, and understands the rule without being told it.

FIRST VIEWPORT: top, the departure row of flap tiles (player, arrow, board number or "libre") with
one short sentence explaining why; middle, the 3×3 of numbered platforms at full width with the
forced platform outlined and numbered in Apricot and the rest dimmed; bottom, the series score in
tabular flap digits and the primary action. On narrow phones the forced platform opens zoomed with
a global thumbnail; on desktop the whole board is played directly.

SIGNATURE INTERACTION: hovering (mouse, after a 140 ms intent delay) or keyboard-focusing a legal
cell previews its departure: the destination platform's number tile gets a soft ring and the
sentence under the row says where the opponent would go. The flap row stays still until the move is
committed, then flips. (User decision, 2026-11-18: a dashed outline jumping from card to card while
hovering was "extremadamente molesto"; the preview moved to the number tile.)
Motion grammar: flaps fall top-half then bottom-half, staggered left to right, 180–280 ms total;
reduced motion swaps characters instantly. Closing a board drops a large X or O over it; winning
the game cascades every flap to the result.

FORM: departure board, position 1 on the first grounded list (taken as IMPECCABLE'S PICK from the
first roll). seed:01ba8917d88f659b

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
