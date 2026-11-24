---
version: 1
slug: "s-games-fleet-ui-fleet-page-fleet-page-ts-6ace1276"
primary_target: "src/app/features/games/fleet/ui/fleet-page/fleet-page.ts"
related_targets: []
---

# Ship Sink game screen

Scope: the playable Ship Sink route (`fleet`, shown as "Ship Sink", mark SS): fleet placement and
the firing game, against the computer (three levels) and online. No two-people-on-one-device mode:
the fleets are hidden information.
Visitor mode: experience. The board is playable from the first viewport.

Audience and job: a newcomer must see at once where they have fired, what each shot did (water,
hit, sunk) and that a hit earns another shot; a returning player reads both fleets' damage at a
glance.

Rules v1 (user decisions, 2026-11-24): 10×10, fleet 5·4·3·3·2, ships never touch (not even
diagonally), a hit shoots again, no draws. 10×10 must lay out well on mobile; an 8×8 variant may
come later.

Decided before the build (user, 2026-11-24): quick placement (the fleet arrives placed at random;
tap a ship to move it, rotate it, then confirm; "Al azar" reshuffles); hits get an ink of their
own, a palette-derived Sand, like the Dots inks (a recorded exception to the Shared Ink Rule);
Apricot stays reserved for the next shot and the win; tone is a station announcement: the flap
row announces "F4 · TOCADO" and "HUNDIDO", with the system's brief spark and nothing louder.

## Direction contract

THESIS: both fleets frame the battle like trains on a quay. The enemy waters sit between the
rival's fleet and yours, and every hit flips a coach. This refuses the category default of two
identical side-by-side grids with red and white pegs.

OWN-WORLD: Raven Teal ground with its wash; 10×10 of Raven Deep cells (2px gaps, A–J rows, 1–10
columns in Seagrass Dim, the aimed row and column in Apricot). Water is a small Seagrass Dim dot;
a hit is a round-capped Sand X; a sunk ship's cells drop to Raven Deepest with a 2px Chalk outline
around the whole ship, and its no-touch rim fills with water dots. Each ship is a train of small
flap coaches: the rival's are blank until sunk, yours are Seagrass with hit coaches in Sand. Your
own waters are a thumbnail with your ships as Seagrass capsules and the rival's last shot ringed
in Chalk. Barlow Semi Condensed, tabular flaps.

STORY: the player reads "F4 · TOCADO", sees the Apricot ring on F5, fires, watches the row flip
to the outcome and, when a ship sinks, its coaches flip in the rival's train; between turns the
thumbnail shows where the rival fired at them.

FIRST VIEWPORT: masthead; the flap row with the last coordinate and its outcome, one sentence
under it; the rival's fleet train with "4 a flote"; the enemy waters at full width; in the thumb
zone, "Tu flota" trains with their damage beside the own-waters thumbnail; the score and the one
primary action, "Disparar". From 48rem landscape: side column for row, trains and score, the
enemy board at full height.

SIGNATURE INTERACTION: tap (or arrows and Enter) aims: the Apricot ring and its row and column
labels move, and a second tap or "Disparar" fires; the outcome flips the row, then the cell. The
rival's shot rings its cell in the thumbnail and flips your coach on a hit. Motion grammar: the
system's flaps (180–280 ms, staggered); reduced motion swaps instantly.

FORM: fleet quay, position 7 on the grounded list (dealt as THE ROLL). seed:765b72e9601a69f4

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Placement screen composition (same quay, the enemy board replaced by your waters at full width).
- On short phones, whether the rival's train folds into the "4 a flote" label.
- The Sand ink's high-contrast value and its contrast against Raven Deep.
