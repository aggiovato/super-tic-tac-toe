import { Component, input } from '@angular/core';

/**
 * The large mark over a closed board: X or O for its winner, two bars for a draw, over a halo in
 * the board colour so any line passes beneath it. Drawn on only when `animate`. The colour can be
 * set by the board through `--closing-colour` (e.g. the win colour).
 */
@Component({
  selector: 'app-closing-mark',
  templateUrl: './closing-mark.html',
  styleUrl: './closing-mark.css',
  host: {
    'aria-hidden': 'true',
    '[class.mark-x]': "mark() === 'X'",
    '[class.mark-o]': "mark() === 'O'",
    '[class.drawn]': "mark() === '='",
    '[class.animate]': 'animate()',
  },
})
export class ClosingMark {
  readonly mark = input.required<'X' | 'O' | '='>();
  /** Draws the mark on as it appears; false shows it already drawn. */
  readonly animate = input(false);
}
