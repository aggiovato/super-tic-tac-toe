import { Component, input } from '@angular/core';
import { crossPath } from '@ui';

type Mark = 'x' | 'o';

/** The classic game, X about to win along the diagonal. */
const CELL = 22;
const CLASSIC_ORIGIN = { x: 80 - (3 * CELL) / 2, y: 12 };
const CLASSIC_MARKS: readonly (readonly [number, Mark])[] = [
  [0, 'x'],
  [1, 'o'],
  [4, 'x'],
  [2, 'o'],
  [8, 'x'],
  [3, 'o'],
];
const classicMarks = CLASSIC_MARKS.map(([cell, mark]) => ({
  cx: CLASSIC_ORIGIN.x + (cell % 3) * CELL + CELL / 2,
  cy: CLASSIC_ORIGIN.y + Math.floor(cell / 3) * CELL + CELL / 2,
  mark,
}));

/**
 * A drawn scene of the classic game for the game library: a position mid-game in the app's own strokes and inks, so it follows
 * the design and high contrast. Decorative: the card names the game.
 */
@Component({
  selector: 'app-classic-preview',
  host: { 'aria-hidden': 'true' },
  styleUrl: './classic-preview.css',
  template: `
    <svg
      [attr.viewBox]="square() ? '38 3 84 84' : '0 0 160 90'"
      preserveAspectRatio="xMidYMid meet"
    >
      <path class="grid wide" [attr.d]="grid" />
      @for (cell of marks; track $index) {
        @if (cell.mark === 'x') {
          <path class="mark x" [attr.d]="cross(cell.cx, cell.cy, 6)" />
        } @else {
          <circle class="mark o" [attr.cx]="cell.cx" [attr.cy]="cell.cy" r="6" />
        }
      }
      <line
        class="strike"
        [attr.x1]="marks[0].cx - 5"
        [attr.y1]="marks[0].cy - 5"
        [attr.x2]="marks[4].cx + 5"
        [attr.y2]="marks[4].cy + 5"
      />
    </svg>
  `,
})
export class ClassicPreview {
  /** Framed tight on the board, for small square thumbnails. */
  readonly square = input(false);

  protected readonly marks = classicMarks;
  protected readonly grid = [1, 2]
    .map((i) => {
      const at = i * CELL;
      const { x, y } = CLASSIC_ORIGIN;
      return `M${x + at} ${y + 2}V${y + 3 * CELL - 2}M${x + 2} ${y + at}H${x + 3 * CELL - 2}`;
    })
    .join('');

  protected readonly cross = crossPath;
}
