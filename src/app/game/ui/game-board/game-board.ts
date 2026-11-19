import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import type { Line, Mark, Move } from '@core';
import { Translator } from '@i18n';
import {
  fadeIn,
  flipFrom,
  Icon,
  injectMediaQuery,
  renderChange,
  StrikeLine,
  type FlipOptions,
  type Segment,
} from '@kit';
import { Preferences } from '@settings';
import { GameStore } from '@state';
import { BoardPlatform, type CellPointer } from '../board-platform/board-platform';
import type { PlatformView } from '../board-platform/platform-view.model';

/** How the board is played right now. */
type Mode =
  /** Wide layout: every cell is a button. */
  | 'direct'
  /** Narrow layout, global view: pick a board to open. */
  | 'pick'
  /** Narrow layout, one board open with a thumbnail of the whole game. */
  | 'zoom';

const INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Below this width a cell would be under 44 px: boards are picked, then played open. */
const COMPACT_QUERY = '(max-width: 34.99rem)';
/** Pause on the whole board after a move on narrow screens, before the next board opens. */
const PAUSE_BEFORE_OPEN_MS = 480;
/** Hover intent: a preview appears or clears only once the pointer settles. */
const PREVIEW_DELAY_MS = 140;
/** How far a board's strike line overshoots its outer marks, as a share of its length. */
const OVERSHOOT = 0.22;
/** The game's strike line overshoots less and stays inside the board grid. */
const GAME_OVERSHOOT = 0.08;

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

/** Segment from `a` to `b` (percent points), overshooting both ends. */
const overshoot = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  share = OVERSHOOT,
): Segment => ({
  x1: a.x - (b.x - a.x) * share,
  y1: a.y - (b.y - a.y) * share,
  x2: b.x + (b.x - a.x) * share,
  y2: b.y + (b.y - a.y) * share,
});

/** Keeps a segment's ends inside its container (percent), so a line never runs onto the page. */
const clampSegment = (segment: Segment): Segment => {
  const clamp = (value: number): number => Math.min(99, Math.max(1, value));
  return {
    x1: clamp(segment.x1),
    y1: clamp(segment.y1),
    x2: clamp(segment.x2),
    y2: clamp(segment.y2),
  };
};

/** Segment through the centres of a line of a 3×3 grid, in percent of the grid. */
const gridStrike = (line: Line): Segment => {
  const centre = (i: number) => ({
    x: ((i % 3) * 2 + 1) * (100 / 6),
    y: (Math.floor(i / 3) * 2 + 1) * (100 / 6),
  });
  return overshoot(centre(line[0]), centre(line[2]));
};

const easingOf = (value: string | undefined): string => {
  const easing = value?.trim() ?? '';
  return easing.length > 0 ? easing : 'ease-out';
};

/**
 * The nine numbered platforms. One keyboard entry point: Tab lands on a single roving item and
 * the arrow keys jump to the next legal option in that direction; Escape leaves an open board.
 * On narrow screens boards grow out of, and settle back into, their place in the grid.
 */
@Component({
  selector: 'app-game-board',
  imports: [BoardPlatform, Icon, StrikeLine],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
  host: {
    '[class.zoomed]': "mode() === 'zoom'",
    '(window:keydown)': 'onWindowKeydown($event)',
    '(window:pointerdown)': 'usingKeyboard = false',
    '(window:resize)': 'onResize()',
  },
})
export class GameBoard {
  protected readonly store = inject(GameStore);
  protected readonly preferences = inject(Preferences);
  protected readonly t = inject(Translator).t;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly indices = INDICES;

  /** Narrow screens pick a board, then play it open. */
  private readonly compact = injectMediaQuery(COMPACT_QUERY);
  /** Changes on resize so measured layout (the win line) is measured again. */
  private readonly viewport = signal(0);
  /** Whether the last interaction was a key press: only then does focus move or preview. */
  protected usingKeyboard = false;
  /** Devices that can hover; on touch screens a tap plays at once, so nothing previews. */
  private readonly canHover = injectMediaQuery('(hover: hover)');

  private pendingOpen: ReturnType<typeof setTimeout> | undefined;
  private pendingPreview: ReturnType<typeof setTimeout> | undefined;

  private readonly winStrike = viewChild(StrikeLine);

  protected readonly mode = computed((): Mode => {
    if (!this.compact()) {
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

  /** Every platform's view, derived once per change of the game, mode, preview or language. */
  protected readonly platforms = computed((): readonly PlatformView[] => {
    const game = this.store.game();
    const t = this.t();
    const mode = this.mode();
    const legal = this.legalKeys();
    const last = this.store.lastMove();
    const playable = this.store.playableBoards();
    const previewTarget = this.store.previewTarget();
    const { status, target } = game;
    return INDICES.map((board) => {
      const boardStatus = game.boards[board];
      const forced = target.kind === 'forced' && target.board === board;
      const closing =
        boardStatus?.kind === 'won'
          ? boardStatus.winner
          : boardStatus?.kind === 'drawn'
            ? '='
            : null;
      const label =
        boardStatus?.kind === 'won'
          ? t.closedWon(board + 1, boardStatus.winner)
          : boardStatus?.kind === 'drawn'
            ? t.closedDrawn(board + 1)
            : t.board(board + 1);
      return {
        board,
        number: String(board + 1),
        label,
        forced,
        freePick: target.kind === 'free' && playable.has(board),
        playable: playable.has(board),
        closed: boardStatus?.kind !== 'open',
        preview: previewTarget === board,
        win: status.kind === 'won' && status.line.includes(board),
        spin: forced ? game.revision : 0,
        closing,
        strike: boardStatus?.kind === 'won' ? gridStrike(boardStatus.line) : null,
        cells: INDICES.map((cell) => {
          const mark = game.cells[board]?.[cell] ?? null;
          return {
            cell,
            mark,
            glyph: glyphOf(mark),
            legal: legal.has(board * 9 + cell),
            last: last?.board === board && last.cell === cell,
            label: t.cell(board + 1, cell + 1, mark),
            roving: mode === 'zoom' ? cell : globalIndex(board, cell),
          };
        }),
      };
    });
  });

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

  constructor() {
    // The win line goes through the centres of the three winning grids as rendered (each grid
    // sits under its board's number, so card centres would be off): measure, then place.
    afterRenderEffect({
      earlyRead: () => {
        this.viewport();
        return this.measureWinLine();
      },
      write: (segment) => {
        const value = segment();
        if (value) {
          this.winStrike()?.place(value);
        }
      },
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.pendingOpen);
      clearTimeout(this.pendingPreview);
    });
  }

  protected onResize(): void {
    this.viewport.update((n) => n + 1);
  }

  protected isLegal(board: number, cell: number): boolean {
    return this.legalKeys().has(board * 9 + cell);
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
      // Keyboard play continues on the next legal cell; a mouse click leaves focus alone.
      if (this.usingKeyboard) {
        this.focusRovingAfterRender();
      }
      return;
    }
    // Narrow screens: when the move sends the opponent to this same board, it simply stays open.
    // Otherwise the board settles back into its slot, showing the move in place; then, after a
    // beat, the forced board grows out of its own slot.
    const from = this.zoomElement()?.getBoundingClientRect();
    let stays = false;
    void renderChange(this.injector, () => {
      this.store.play(move);
      const target = this.store.game().target;
      stays = target.kind === 'forced' && target.board === board && this.preferences.autoZoom();
      if (stays) {
        this.store.openBoard(board);
      }
    }).then(() => {
      if (stays) {
        this.focusRovingIfKeyboard();
        return;
      }
      void this.settleInto(board, from).then(() => {
        const target = this.store.game().target;
        if (target.kind !== 'forced' || !this.preferences.autoZoom()) {
          this.focusRovingIfKeyboard();
          return;
        }
        const pause = this.preferences.reducedMotion() ? 0 : PAUSE_BEFORE_OPEN_MS;
        this.pendingOpen = setTimeout(() => this.open(target.board), pause);
      });
    });
  }

  protected open(board: number): void {
    clearTimeout(this.pendingOpen);
    if (!this.store.playableBoards().has(board)) {
      return;
    }
    const from = this.slotElement(board)?.getBoundingClientRect();
    void renderChange(this.injector, () => this.store.openBoard(board))
      .then(() => {
        const zoom = this.zoomElement();
        const motion = this.motion();
        if (!zoom || !from || !motion) {
          return;
        }
        fadeIn(
          this.host.nativeElement.querySelectorAll('.thumbnail'),
          motion,
          motion.duration * 0.3,
        );
        return flipFrom(zoom, from, motion);
      })
      .then(() => this.focusRovingIfKeyboard());
  }

  protected back(): void {
    clearTimeout(this.pendingOpen);
    const board = this.zoomed();
    const from = this.zoomElement()?.getBoundingClientRect();
    void renderChange(this.injector, () => this.store.showGlobal())
      .then(() => (board === null ? undefined : this.settleInto(board, from)))
      .then(() => {
        if (board !== null) {
          this.roving.set(board);
        }
        this.focusRovingIfKeyboard();
      });
  }

  /** Previews follow a real mouse pointer, once it settles on a cell. */
  protected onCellEnter(board: number, { cell, event }: CellPointer): void {
    if (event.pointerType === 'mouse' && this.canHover()) {
      this.previewSoon({ board, cell });
    }
  }

  protected onCellLeave(): void {
    this.previewSoon(null);
  }

  /** Keyboard focus previews; focus moved by the app after a tap or click does not. */
  protected onCellFocus(board: number, cell: number): void {
    this.roving.set(this.mode() === 'zoom' ? cell : globalIndex(board, cell));
    if (this.usingKeyboard) {
      this.preview({ board, cell });
    }
  }

  /** Any key switches to keyboard mode; Escape leaves an open board wherever focus is. */
  protected onWindowKeydown(event: KeyboardEvent): void {
    this.usingKeyboard = true;
    if (event.key === 'Escape' && this.mode() === 'zoom' && !event.defaultPrevented) {
      event.preventDefault();
      this.back();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const delta = ARROWS[event.key];
    if (!delta) {
      return;
    }
    event.preventDefault();
    this.roving.set(this.nextOption(this.roving(), delta));
    this.focusRoving();
  }

  private preview(move: Move | null): void {
    this.store.setPreview(
      move && this.preferences.hints() && this.isLegal(move.board, move.cell) ? move : null,
    );
  }

  private previewSoon(move: Move | null): void {
    clearTimeout(this.pendingPreview);
    this.pendingPreview = setTimeout(() => this.preview(move), PREVIEW_DELAY_MS);
  }

  /** The win line in percent of the board, from the rendered grids; null when there is none. */
  private measureWinLine(): Segment | null {
    const status = this.store.game().status;
    const board = this.host.nativeElement.querySelector<HTMLElement>('.board');
    if (status.kind !== 'won' || this.mode() === 'zoom' || !board) {
      return null;
    }
    const frame = board.getBoundingClientRect();
    const centre = (index: number) => {
      const grid = board.querySelector(`[data-cells="${index}"]`)?.getBoundingClientRect();
      return grid
        ? {
            x: ((grid.left + grid.width / 2 - frame.left) / frame.width) * 100,
            y: ((grid.top + grid.height / 2 - frame.top) / frame.height) * 100,
          }
        : null;
    };
    const a = centre(status.line[0]);
    const b = centre(status.line[2]);
    return a && b ? clampSegment(overshoot(a, b, GAME_OVERSHOOT)) : null;
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

  /** The open board shrinks back into its slot while the other boards fade in around it. */
  private settleInto(board: number, from: DOMRect | undefined): Promise<void> {
    const slot = this.slotElement(board);
    const motion = this.motion();
    if (!slot || !from || !motion) {
      return Promise.resolve();
    }
    const others = [...this.host.nativeElement.querySelectorAll('[data-board]')].filter(
      (element) => element !== slot,
    );
    fadeIn(others, motion, motion.duration * 0.25);
    slot.style.zIndex = '2';
    return flipFrom(slot, from, motion).then(() => {
      slot.style.zIndex = '';
    });
  }

  private slotElement(board: number): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(`[data-board="${board}"]`);
  }

  private zoomElement(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>('.zoom');
  }

  /** Duration and easing from the `--duration-zoom` and `--ease-out` tokens; null without motion. */
  private motion(): FlipOptions | null {
    if (this.preferences.reducedMotion()) {
      return null;
    }
    const style = this.document.defaultView?.getComputedStyle(this.host.nativeElement);
    return {
      duration: Number.parseFloat(style?.getPropertyValue('--duration-zoom') ?? '') || 420,
      easing: easingOf(style?.getPropertyValue('--ease-out')),
    };
  }

  private focusRoving(): void {
    this.host.nativeElement.querySelector<HTMLElement>(`[data-roving="${this.roving()}"]`)?.focus();
  }

  private focusRovingIfKeyboard(): void {
    if (this.usingKeyboard) {
      this.focusRoving();
    }
  }

  private focusRovingAfterRender(): void {
    afterNextRender({ write: () => this.focusRoving() }, { injector: this.injector });
  }
}
