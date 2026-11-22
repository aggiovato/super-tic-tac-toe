import { Component, input } from '@angular/core';
import { crossPath } from '@ui';

type Mark = 'x' | 'o';

interface MiniBoard {
  readonly x: number;
  readonly y: number;
  /** A closed board's large mark, else null. */
  readonly closed: Mark | null;
  /** The board the next move must go to. */
  readonly target: boolean;
  readonly marks: readonly { readonly cx: number; readonly cy: number; readonly mark: Mark }[];
}

/** Super 3T mid-game: two boards closed, the next move sent to the centre. */
const SUPER_CLOSED: Readonly<Record<number, Mark>> = { 0: 'x', 5: 'o', 6: 'x' };
const SUPER_TARGET = 4;
const SUPER_MARKS: Readonly<Record<number, readonly (readonly [number, Mark])[]>> = {
  1: [
    [4, 'o'],
    [0, 'x'],
  ],
  2: [[2, 'x']],
  3: [
    [6, 'o'],
    [4, 'x'],
  ],
  4: [
    [0, 'o'],
    [8, 'x'],
  ],
  7: [[3, 'o']],
  8: [
    [4, 'x'],
    [5, 'o'],
  ],
};
const MINI = 24;
const MINI_GAP = 3;
const SUPER_ORIGIN = { x: 80 - (3 * MINI + 2 * MINI_GAP) / 2, y: 6 };

const superBoards: readonly MiniBoard[] = Array.from({ length: 9 }, (_, board) => {
  const x = SUPER_ORIGIN.x + (board % 3) * (MINI + MINI_GAP);
  const y = SUPER_ORIGIN.y + Math.floor(board / 3) * (MINI + MINI_GAP);
  return {
    x,
    y,
    closed: SUPER_CLOSED[board] ?? null,
    target: board === SUPER_TARGET,
    marks: (SUPER_MARKS[board] ?? []).map(([cell, mark]) => ({
      cx: x + (cell % 3) * 8 + 4,
      cy: y + Math.floor(cell / 3) * 8 + 4,
      mark,
    })),
  };
});

/**
 * A drawn scene of Super 3T for the game library: a position mid-game in the app's own strokes and inks, so it follows
 * the design and high contrast. Decorative: the card names the game.
 */
@Component({
  selector: 'app-super3t-preview',
  host: { 'aria-hidden': 'true' },
  styleUrl: './super3t-preview.css',
  template: `
    <svg
      [attr.viewBox]="square() ? '38 3 84 84' : '0 0 160 90'"
      preserveAspectRatio="xMidYMid meet"
    >
      @for (board of boards; track $index) {
        <g [class.closed]="board.closed">
          <rect class="mini" [attr.x]="board.x" [attr.y]="board.y" width="24" height="24" rx="2" />
          @if (board.closed; as mark) {
            @if (mark === 'x') {
              <path class="mark x big" [attr.d]="cross(board.x + 12, board.y + 12, 7)" />
            } @else {
              <circle class="mark o big" [attr.cx]="board.x + 12" [attr.cy]="board.y + 12" r="7" />
            }
          } @else {
            <path class="grid" [attr.d]="miniGrid(board.x, board.y)" />
            @for (cell of board.marks; track $index) {
              @if (cell.mark === 'x') {
                <path class="mark x" [attr.d]="cross(cell.cx, cell.cy, 2.2)" />
              } @else {
                <circle class="mark o" [attr.cx]="cell.cx" [attr.cy]="cell.cy" r="2.2" />
              }
            }
          }
          @if (board.target) {
            <rect
              class="target"
              [attr.x]="board.x - 1"
              [attr.y]="board.y - 1"
              width="26"
              height="26"
              rx="3"
            />
          }
        </g>
      }
    </svg>
  `,
})
export class Super3tPreview {
  /** Framed tight on the board, for small square thumbnails. */
  readonly square = input(false);

  protected readonly boards = superBoards;

  protected miniGrid(x: number, y: number): string {
    return `M${x + 8} ${y + 2}V${y + 22}M${x + 16} ${y + 2}V${y + 22}M${x + 2} ${y + 8}H${x + 22}M${x + 2} ${y + 16}H${x + 22}`;
  }

  protected readonly cross = crossPath;
}
