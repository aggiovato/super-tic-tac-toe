import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
} from '@angular/core';
import type { Line, Mark, Move } from '@core';
import { Translator } from '@i18n';
import { Icon, SplitFlap, StrikeLine, type Segment } from '@kit';
import { Preferences } from '@settings';
import { GameStore } from '@state';
import { injectMediaQuery } from './media-query';
import { runViewTransition } from './view-transition';

/** How the board is played right now. */
type Mode =
  /** Wide layout: every cell is a button. */
  | 'direct'
  /** Narrow layout, global view: pick a board to open. */
  | 'pick'
  /** Narrow layout, one board open with a thumbnail of the whole game. */
  | 'zoom';

const INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Pause on the whole board after a move on narrow screens, before the next board opens. */
const PAUSE_BEFORE_OPEN_MS = 520;

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Index of a cell in the 9×9 reading order of the whole board. */
const globalIndex = (board: number, cell: number): number =>
  (Math.floor(board / 3) * 3 + Math.floor(cell / 3)) * 9 + (board % 3) * 3 + (cell % 3);

/** Inverse of `globalIndex`. */
const moveAt = (index: number): Move => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  return {
    board: Math.floor(row / 3) * 3 + Math.floor(col / 3),
    cell: (row % 3) * 3 + (col % 3),
  };
};

/** Flap character for a mark: players are drawn glyphs, empty is blank. */
const glyphOf = (mark: Mark): string => (mark === 'X' ? 'x' : mark === 'O' ? 'o' : ' ');

/** Segment through the centres of a line of a 3×3 grid, overshooting both ends, in percent. */
function strike(line: Line): Segment {
  const centre = (i: number) => ({
    x: ((i % 3) * 2 + 1) * (100 / 6),
    y: (Math.floor(i / 3) * 2 + 1) * (100 / 6),
  });
  const a = centre(line[0]);
  const b = centre(line[2]);
  const over = 0.22;
  return {
    x1: a.x - (b.x - a.x) * over,
    y1: a.y - (b.y - a.y) * over,
    x2: b.x + (b.x - a.x) * over,
    y2: b.y + (b.y - a.y) * over,
  };
}

/**
 * The nine numbered platforms. One keyboard entry point: Tab lands on a single roving item and
 * the arrow keys jump to the next legal option in that direction; Escape leaves an open board.
 * On narrow screens boards open from, and close into, their place in the grid.
 */
@Component({
  selector: 'app-game-board',
  imports: [NgTemplateOutlet, SplitFlap, Icon, StrikeLine],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
  host: {
    '[class.zoomed]': "mode() === 'zoom'",
    '(window:keydown)': 'usingKeyboard = true',
    '(window:pointerdown)': 'usingKeyboard = false',
  },
})
export class GameBoard {
  protected readonly store = inject(GameStore);
  protected readonly t = inject(Translator).t;
  protected readonly preferences = inject(Preferences);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly indices = INDICES;
  protected readonly globalIndex = globalIndex;
  protected readonly glyphOf = glyphOf;

  private pendingOpen: ReturnType<typeof setTimeout> | undefined;
  /** Whether the last interaction was a key press: only then does focus preview a departure. */
  protected usingKeyboard = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.pendingOpen));
  }

  protected readonly mode = computed((): Mode => {
    if (!this.store.compact()) {
      return 'direct';
    }
    return this.store.view().kind === 'board' ? 'zoom' : 'pick';
  });

  protected readonly zoomed = computed(() => {
    const view = this.store.view();
    return view.kind === 'board' ? view.board : null;
  });

  private readonly legalKeys = computed(
    () => new Set(this.store.legal().map((move) => move.board * 9 + move.cell)),
  );

  /** Which item holds tabindex 0. Resets to the first legal option whenever the game moves. */
  protected readonly roving = linkedSignal(() => {
    const legal = this.store.legal();
    const first = legal[0];
    switch (this.mode()) {
      case 'direct':
        return first ? globalIndex(first.board, first.cell) : 0;
      case 'zoom':
        return legal.find((move) => move.board === this.zoomed())?.cell ?? 0;
      case 'pick':
        return first?.board ?? 0;
    }
  });

  /** The winning line across boards, once the game is won. */
  protected readonly winLine = computed((): Segment | null => {
    const status = this.store.game().status;
    return status.kind === 'won' ? strike(status.line) : null;
  });

  protected mark(board: number, cell: number): Mark {
    return this.store.game().cells[board]?.[cell] ?? null;
  }

  protected isLegal(board: number, cell: number): boolean {
    return this.legalKeys().has(board * 9 + cell);
  }

  protected isLast(board: number, cell: number): boolean {
    const last = this.store.lastMove();
    return last?.board === board && last.cell === cell;
  }

  protected isForced(board: number): boolean {
    const target = this.store.game().target;
    return target.kind === 'forced' && target.board === board;
  }

  /**
   * Playable on a free choice after a move sent to a closed board: shown as a departure too, with
   * a lighter outline. The opening is free as well but stays calm; its sentence explains it.
   */
  protected isFreePick(board: number): boolean {
    const game = this.store.game();
    return (
      game.target.kind === 'free' && game.moves.length > 0 && this.store.playableBoards().has(board)
    );
  }

  /** Replays the number flap each time this board becomes the forced destination. */
  protected spinOf(board: number): number {
    return this.isForced(board) ? this.store.game().revision : 0;
  }

  protected closingGlyph(board: number): string | null {
    const status = this.store.game().boards[board];
    if (status?.kind === 'won') {
      return glyphOf(status.winner);
    }
    return status?.kind === 'drawn' ? '=' : null;
  }

  /** The line that closed a board, as a segment over its cells. */
  protected localStrike(board: number): Segment | null {
    const status = this.store.game().boards[board];
    return status?.kind === 'won' ? strike(status.line) : null;
  }

  protected isWinningBoard(board: number): boolean {
    const status = this.store.game().status;
    return status.kind === 'won' && status.line.includes(board);
  }

  protected boardLabel(board: number): string {
    const status = this.store.game().boards[board];
    const t = this.t();
    if (status?.kind === 'won') {
      return t.closedWon(board + 1, status.winner);
    }
    return status?.kind === 'drawn' ? t.closedDrawn(board + 1) : t.board(board + 1);
  }

  protected cellLabel(board: number, cell: number): string {
    return this.t().cell(board + 1, cell + 1, this.mark(board, cell));
  }

  /** Illegal cells still reach the store, so the reason is shown instead of nothing happening. */
  protected play(board: number, cell: number): void {
    clearTimeout(this.pendingOpen);
    const move = { board, cell };
    if (!this.isLegal(board, cell)) {
      this.store.play(move);
      return;
    }
    if (this.mode() !== 'zoom') {
      this.store.play(move);
      this.focusRovingAfterRender();
      return;
    }
    // Narrow screens: the open board closes back into the grid, showing the move in place; then,
    // after a beat, the forced board opens from its own place.
    void this.transition(() => this.store.play(move)).then(() => {
      const target = this.store.game().target;
      if (target.kind !== 'forced' || !this.preferences.autoZoom()) {
        this.focusRovingAfterRender();
        return;
      }
      const pause = this.preferences.reducedMotion() ? 0 : PAUSE_BEFORE_OPEN_MS;
      this.pendingOpen = setTimeout(() => this.open(target.board), pause);
    });
  }

  protected open(board: number): void {
    clearTimeout(this.pendingOpen);
    if (!this.store.playableBoards().has(board)) {
      return;
    }
    void this.transition(() => this.store.openBoard(board)).then(() => this.focusRoving());
  }

  protected back(): void {
    clearTimeout(this.pendingOpen);
    const board = this.zoomed();
    void this.transition(() => this.store.showGlobal()).then(() => {
      if (board !== null) {
        this.roving.set(board);
      }
      this.focusRoving();
    });
  }

  protected preview(move: Move | null): void {
    this.store.setPreview(
      move && this.preferences.hints() && this.isLegal(move.board, move.cell) ? move : null,
    );
  }

  /** Devices that can hover; on touch screens a tap plays at once, so nothing previews. */
  private readonly canHover = injectMediaQuery('(hover: hover)');

  /** Previews follow a real mouse pointer. */
  protected onPointerEnter(event: PointerEvent, move: Move): void {
    if (event.pointerType === 'mouse' && this.canHover()) {
      this.preview(move);
    }
  }

  /** Keyboard focus previews; focus moved by the app after a tap or click does not. */
  protected onFocusItem(index: number, move: Move): void {
    this.roving.set(index);
    if (this.usingKeyboard) {
      this.preview(move);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.mode() === 'zoom') {
      event.preventDefault();
      this.back();
      return;
    }
    const delta = ARROWS[event.key];
    if (!delta) {
      return;
    }
    event.preventDefault();
    this.roving.set(this.nextOption(this.roving(), delta));
    this.focusRoving();
  }

  /** Next legal option in the arrow's direction, or the current one when there is none. */
  private nextOption(index: number, [dRow, dCol]: readonly [number, number]): number {
    const mode = this.mode();
    const size = mode === 'direct' ? 9 : 3;
    const valid = (i: number): boolean => {
      if (mode === 'direct') {
        const { board, cell } = moveAt(i);
        return this.isLegal(board, cell);
      }
      if (mode === 'zoom') {
        return this.isLegal(this.zoomed() ?? 0, i);
      }
      return this.store.playableBoards().has(i);
    };
    let row = Math.floor(index / size) + dRow;
    let col = (index % size) + dCol;
    while (row >= 0 && row < size && col >= 0 && col < size) {
      if (valid(row * size + col)) {
        return row * size + col;
      }
      row += dRow;
      col += dCol;
    }
    return index;
  }

  private transition(update: () => void): Promise<void> {
    return runViewTransition(
      this.document,
      this.injector,
      this.preferences.reducedMotion(),
      update,
    );
  }

  private focusRoving(): void {
    this.host.nativeElement.querySelector<HTMLElement>(`[data-roving="${this.roving()}"]`)?.focus();
  }

  private focusRovingAfterRender(): void {
    afterNextRender({ write: () => this.focusRoving() }, { injector: this.injector });
  }
}
