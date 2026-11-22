import { Component, input } from '@angular/core';
import type { GameId } from '@preferences';

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

/** Dots and Boxes: a box each, some lines drawn in the players' inks, the rest still to join. */
const DOTS_ORIGIN = CLASSIC_ORIGIN;
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
 * A drawn scene of each game for the game library: a position mid-game in the app's own strokes and
 * inks, so it follows the design and high contrast. Decorative: the card names the game.
 */
@Component({
  selector: 'app-game-preview',
  host: { 'aria-hidden': 'true' },
  styleUrl: './game-preview.css',
  template: `
    <svg
      [attr.viewBox]="square() ? '38 3 84 84' : '0 0 160 90'"
      preserveAspectRatio="xMidYMid meet"
    >
      @switch (game()) {
        @case ('super-3t') {
          @for (board of superBoards; track $index) {
            <g [class.closed]="board.closed">
              <rect
                class="mini"
                [attr.x]="board.x"
                [attr.y]="board.y"
                width="24"
                height="24"
                rx="2"
              />
              @if (board.closed; as mark) {
                @if (mark === 'x') {
                  <path class="mark x big" [attr.d]="cross(board.x + 12, board.y + 12, 7)" />
                } @else {
                  <circle
                    class="mark o big"
                    [attr.cx]="board.x + 12"
                    [attr.cy]="board.y + 12"
                    r="7"
                  />
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
        }
        @case ('classic') {
          <path class="grid wide" [attr.d]="classicGrid" />
          @for (cell of classicMarks; track $index) {
            @if (cell.mark === 'x') {
              <path class="mark x" [attr.d]="cross(cell.cx, cell.cy, 6)" />
            } @else {
              <circle class="mark o" [attr.cx]="cell.cx" [attr.cy]="cell.cy" r="6" />
            }
          }
          <line
            class="strike"
            [attr.x1]="classicMarks[0].cx - 5"
            [attr.y1]="classicMarks[0].cy - 5"
            [attr.x2]="classicMarks[4].cx + 5"
            [attr.y2]="classicMarks[4].cy + 5"
          />
        }
        @case ('dots') {
          @for (box of dotsBoxes; track $index) {
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
          @for (line of dotsLines; track $index) {
            <line
              [class]="line.owner ? 'ink line ' + line.owner : 'guide'"
              [attr.x1]="line.x1"
              [attr.y1]="line.y1"
              [attr.x2]="line.x2"
              [attr.y2]="line.y2"
            />
          }
          @for (dot of dotsDots; track $index) {
            <circle class="dot" [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="1.4" />
          }
        }
      }
    </svg>
  `,
})
export class GamePreview {
  readonly game = input.required<GameId>();
  /** Framed tight on the board, for small square thumbnails. */
  readonly square = input(false);

  protected readonly superBoards = superBoards;
  protected readonly classicMarks = classicMarks;
  protected readonly dotsLines = dotsLines;
  protected readonly dotsDots = dotsDots;
  protected readonly dotsBoxes = dotsBoxes;
  protected readonly classicGrid = [1, 2]
    .map((i) => {
      const at = i * CELL;
      const { x, y } = CLASSIC_ORIGIN;
      return `M${x + at} ${y + 2}V${y + 3 * CELL - 2}M${x + 2} ${y + at}H${x + 3 * CELL - 2}`;
    })
    .join('');

  protected cross(cx: number, cy: number, r: number): string {
    return `M${cx - r} ${cy - r}L${cx + r} ${cy + r}M${cx + r} ${cy - r}L${cx - r} ${cy + r}`;
  }

  protected miniGrid(x: number, y: number): string {
    return `M${x + 8} ${y + 2}V${y + 22}M${x + 16} ${y + 2}V${y + 22}M${x + 2} ${y + 8}H${x + 22}M${x + 2} ${y + 16}H${x + 22}`;
  }
}
