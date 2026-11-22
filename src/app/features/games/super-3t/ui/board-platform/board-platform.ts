import { Component, input, output } from '@angular/core';
import { SplitFlap, StrikeLine } from '@ui';
import type { PlatformView } from './platform-view.model';
import { BoardCell, ClosingMark } from '@ui';

export interface CellPointer {
  readonly cell: number;
  readonly event: PointerEvent;
}

/**
 * One numbered platform: a flap number over a classic 3×3 grid of cells (`BoardCell`), the line
 * that closed it and its large mark (`ClosingMark`). Applied to the element that hosts it (`div`, `button` or `span`), so the board decides
 * the semantics. Cells are buttons only when `interactive`.
 */
@Component({
  selector: '[app-board-platform]',
  imports: [BoardCell, ClosingMark, SplitFlap, StrikeLine],
  templateUrl: './board-platform.html',
  styleUrl: './board-platform.css',
  host: {
    class: 'platform',
    '[class.forced]': 'view().forced',
    '[class.free-pick]': 'view().freePick',
    '[class.playable]': 'view().playable',
    '[class.closed]': 'view().closed',
    '[class.preview]': 'view().preview',
    '[class.win]': 'view().win',
    '[class.fresh]': 'view().fresh',
    '[class.spark]': 'view().spark',
    '[class.win-spark]': 'view().winSpark',
  },
})
export class BoardPlatform {
  readonly view = input.required<PlatformView>({ alias: 'app-board-platform' });
  /** Cells are buttons. */
  readonly interactive = input(false);
  /** Empty legal cells always show their number (open board on narrow screens). */
  readonly numbered = input(false);
  /** Hover and focus reveal cell numbers. */
  readonly hints = input(true);
  /** Roving value of the cell that holds tabindex 0. */
  readonly rovingIndex = input(-1);

  readonly cellPlay = output<number>();
  readonly cellEnter = output<CellPointer>();
  readonly cellLeave = output();
  readonly cellFocus = output<number>();
}
