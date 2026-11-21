---
version: 1
slug: "src-app-game-ui-how-to-play-how-to-play-ts"
primary_target: "src/app/game/ui/how-to-play/how-to-play.ts"
related_targets: ["src/app/game/ui/settings-panel/settings-panel.ts"]
---

# How to play (tutorial)

Scope: the first-visit tutorial of the game route and its reopening from the settings.
Visitor mode: experience. It lives inside the real game; it never replaces it.

Audience and job: someone who has never played Ultimate Tic Tac Toe, on their first visit, often on
a phone. In seconds they must know where they may play, why the opponent plays where it does,
and how to win, then play a real game. Owner's decisions (2026-11-21): in the real game, not a
separate practice mode; shown once on the first visit and reopenable from Settings ("Cómo se
juega"); always skippable. Picked from a decision round: "Billete de bienvenida".

## Direction contract

THESIS: the rules arrive as a departure ticket handed to you before boarding: three lines, each
with a tiny board drawing, then you play. Refuses the category default of a multi-step coach-mark
tour that interrupts every move.

OWN-WORLD: the ticket is a Raven Deep card with notched sides and a perforated tear line above its
actions, over the real board dimmed by the shade veil. Title in Chalk, title weight; rules in Chalk
body type; each rule leads with a 3×3 mini board drawn in the board's own line colour, the
departure shown in Apricot (forced outline and number) and the played cell in Chalk. One Apricot
primary action ("Jugar"), a quiet "Saltar".

STORY: a newcomer opens the app, reads three short rules beside drawings that show them, presses
Jugar and makes their first move on the board behind; the sentence under the departure row keeps
explaining each move from then on.

FIRST VIEWPORT: phones: the ticket rises from the bottom over the dimmed board, full width minus
the gutter: title, one line of intro, three rules (drawing left, text right), tear line, Saltar
left and Jugar right. Wide screens: the same ticket centred over the page, about 26rem wide.

FORM: departure ticket, position 5 on the grounded list. seed:66b6e661fd2b10dd

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
