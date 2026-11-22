import { Component, input } from '@angular/core';
import { crossPath } from '@ui';

type Mark = 'x' | 'o';

const CELL = 22;
/** Dots and Boxes: a box each, some lines drawn in the players' inks, the rest still to join. */
const DOTS_ORIGIN = { x: 80 - (3 * CELL) / 2, y: 12 };
type DotsLine = readonly ['h' | 'v', number, number, Mark | null];
const DOTS_DRAWN: readonly DotsLine[] = [
  ['h', 0, 0, 'x'],
  ['h', 1, 0, 'o'],
  ['v', 0, 0, 'x'],
  ['v', 0, 1, 'x'],
  ['h', 2, 1, 'o'],
  ['h', 3, 1, 'x'],
  ['v', 2, 1, 'o'],
  ['v', 2, 2, 'o'],
  ['h', 0, 2, 'o'],
  ['v', 1, 3, 'x'],
];
const dotsLines = Array.from({ length: 24 }, (_, i): DotsLine => {
  const horizontal = i < 12;
  const index = horizontal ? i : i - 12;
  const row = horizontal ? Math.floor(index / 3) : Math.floor(index / 4);
  const col = horizontal ? index % 3 : index % 4;
  const orientation = horizontal ? 'h' : 'v';
  const drawn = DOTS_DRAWN.find(([o, r, c]) => o === orientation && r === row && c === col);
  return [orientation, row, col, drawn?.[3] ?? null];
}).map(([orientation, row, col, owner]) => {
  const x1 = DOTS_ORIGIN.x + col * CELL;
  const y1 = DOTS_ORIGIN.y + row * CELL;
  return {
    x1,
    y1,
    x2: orientation === 'h' ? x1 + CELL : x1,
    y2: orientation === 'v' ? y1 + CELL : y1,
    owner,
  };
});
const dotsDots = Array.from({ length: 16 }, (_, i) => ({
  cx: DOTS_ORIGIN.x + (i % 4) * CELL,
  cy: DOTS_ORIGIN.y + Math.floor(i / 4) * CELL,
}));
const dotsBoxes = [
  { x: DOTS_ORIGIN.x, y: DOTS_ORIGIN.y, mark: 'x' as Mark },
  { x: DOTS_ORIGIN.x + CELL, y: DOTS_ORIGIN.y + 2 * CELL, mark: 'o' as Mark },
];

/**
 * A drawn scene of Dots and Boxes for the game library: a position mid-game in the app's own strokes and inks, so it follows
 * the design and high contrast. Decorative: the card names the game.
 */
@Component({
  selector: 'app-dots-preview',
  host: { 'aria-hidden': 'true' },
  styleUrl: './dots-preview.css',
  template: `
    <svg
      [attr.viewBox]="square() ? '38 3 84 84' : '0 0 160 90'"
      preserveAspectRatio="xMidYMid meet"
    >
      @for (box of boxes; track $index) {
        <rect
          class="box"
          [class.o]="box.mark === 'o'"
          [attr.x]="box.x"
          [attr.y]="box.y"
          width="22"
          height="22"
        />
        @if (box.mark === 'x') {
          <path class="ink x" [attr.d]="cross(box.x + 11, box.y + 11, 5)" />
        } @else {
          <circle class="ink o" [attr.cx]="box.x + 11" [attr.cy]="box.y + 11" r="5" />
        }
      }
      @for (line of lines; track $index) {
        <line
          [class]="line.owner ? 'ink line ' + line.owner : 'guide'"
          [attr.x1]="line.x1"
          [attr.y1]="line.y1"
          [attr.x2]="line.x2"
          [attr.y2]="line.y2"
        />
      }
      @for (dot of dots; track $index) {
        <circle class="dot" [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="1.4" />
      }
    </svg>
  `,
})
export class DotsPreview {
  /** Framed tight on the board, for small square thumbnails. */
  readonly square = input(false);

  protected readonly lines = dotsLines;
  protected readonly dots = dotsDots;
  protected readonly boxes = dotsBoxes;

  protected readonly cross = crossPath;
}
