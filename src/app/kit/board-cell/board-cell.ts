import { Component, computed, input } from '@angular/core';
import { SplitFlap } from '../split-flap/split-flap';
import type { CellView } from './cell-view.model';

/**
 * One cell of a board: its mark as a flap tile, rings for the last move, hover and focus, and its
 * number when hints allow. Applied to a native `button` (playable) or `span` (display only), so the
 * board keeps the semantics and events. Board states reach it through `--cell-mark-opacity` and
 * `--cell-last-ring`.
 */
@Component({
  selector: 'button[app-board-cell], span[app-board-cell]',
  imports: [SplitFlap],
  templateUrl: './board-cell.html',
  styleUrl: './board-cell.css',
  host: {
    class: 'cell',
    '[class.last]': 'cell().last',
    '[class.legal]': 'cell().legal',
  },
})
export class BoardCell {
  readonly cell = input.required<CellView>({ alias: 'app-board-cell' });
  /** Hover and focus reveal the number of an empty legal cell. */
  readonly hints = input(false);
  /** The number is always shown (open board on narrow screens). */
  readonly numbered = input(false);

  protected readonly showNumber = computed(
    () => this.hints() && this.cell().mark === null && this.cell().legal,
  );
}
