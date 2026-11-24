import { Component, input } from '@angular/core';

const CELL = 8;
const ORIGIN = { x: 80 - 5 * CELL, y: 5 };
type Mark = 'water' | 'hit';
/** A position mid-game: a few misses, a ship found, a sunk destroyer outlined and the next aim. */
const MARKS: readonly (readonly [number, number, Mark])[] = [
  [0, 1, 'water'],
  [1, 7, 'water'],
  [3, 3, 'water'],
  [4, 6, 'water'],
  [6, 8, 'water'],
  [7, 1, 'water'],
  [8, 5, 'water'],
  [5, 2, 'hit'],
  [5, 3, 'hit'],
  [2, 6, 'hit'],
  [2, 7, 'hit'],
];
const cells = Array.from({ length: 100 }, (_, i) => ({
  x: ORIGIN.x + (i % 10) * CELL,
  y: ORIGIN.y + Math.floor(i / 10) * CELL,
}));
const marks = MARKS.map(([row, col, mark]) => ({
  cx: ORIGIN.x + col * CELL + CELL / 2,
  cy: ORIGIN.y + row * CELL + CELL / 2,
  mark,
}));
const wreck = { x: ORIGIN.x + 6 * CELL, y: ORIGIN.y + 2 * CELL, width: 2 * CELL, height: CELL };
const aim = { x: ORIGIN.x + 4 * CELL, y: ORIGIN.y + 5 * CELL };

/**
 * A drawn scene of Ship Sink for the game library: enemy waters mid-game in the board's own marks,
 * so it follows the design and high contrast. Decorative: the card names the game.
 */
@Component({
  selector: 'app-fleet-preview',
  host: { 'aria-hidden': 'true' },
  styleUrl: './fleet-preview.css',
  template: `
    <svg
      [attr.viewBox]="square() ? '38 3 84 84' : '0 0 160 90'"
      preserveAspectRatio="xMidYMid meet"
    >
      @for (cell of cells; track $index) {
        <rect
          class="cell"
          [attr.x]="cell.x + 0.4"
          [attr.y]="cell.y + 0.4"
          width="7.2"
          height="7.2"
          rx="0.6"
        />
      }
      <rect
        class="wreck"
        [attr.x]="wreck.x + 0.4"
        [attr.y]="wreck.y + 0.4"
        [attr.width]="wreck.width - 0.8"
        [attr.height]="wreck.height - 0.8"
        rx="1"
      />
      @for (mark of marks; track $index) {
        @if (mark.mark === 'water') {
          <circle class="water" [attr.cx]="mark.cx" [attr.cy]="mark.cy" r="0.9" />
        } @else {
          <path
            class="hit"
            [attr.d]="'M' + (mark.cx - 2) + ' ' + (mark.cy - 2) + ' l4 4 m0 -4 l-4 4'"
          />
        }
      }
      <rect
        class="aim"
        [attr.x]="aim.x + 0.2"
        [attr.y]="aim.y + 0.2"
        width="7.6"
        height="7.6"
        rx="1"
      />
    </svg>
  `,
})
export class FleetPreview {
  /** Framed tight on the board, for small square thumbnails. */
  readonly square = input(false);

  protected readonly cells = cells;
  protected readonly marks = marks;
  protected readonly wreck = wreck;
  protected readonly aim = aim;
}
