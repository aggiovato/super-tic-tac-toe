import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { BoardStatus, Move } from '@super3t/core';
import { type Messages, Translator } from '@i18n';
import {
  fadeIn,
  fadeOut,
  flipFrom,
  injectMediaQuery,
  renderChange,
  StrikeLine,
  type FlipOptions,
  type Segment,
} from '@kit';
import { Preferences } from '@settings';
import { GameStore } from '@super3t/state';
import { type CellPointer, BoardPlatform } from '../board-platform/board-platform';
import { BoardThumbnail } from '../board-thumbnail/board-thumbnail';
import {
  clampSegment,
  GAME_OVERSHOOT,
  globalIndex,
  glyphOf,
  gridStrike,
  INDICES,
  moveAt,
  overshoot,
} from './board-geometry';
import type { PlatformView } from '../board-platform/platform-view.model';

/** How the board is played right now. */
type Mode =
  /** Wide layout: every cell is a button. */
  | 'direct'
  /** Narrow layout, global view: pick a board to open. */
  | 'pick'
  /** Narrow layout, one board open with a thumbnail of the whole game. */
  | 'zoom';

/** Below this width a cell would be under 44 px: boards are picked, then played open. */
const COMPACT_QUERY = '(max-width: 34.99rem)';
/** Pause on the whole board after a move on narrow screens, before the next board opens. */
const PAUSE_BEFORE_OPEN_MS = 480;
/** Hover intent: a preview appears or clears only once the pointer settles. */
const PREVIEW_DELAY_MS = 140;
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** The large mark over a board: its winner, `=` for a draw, nothing while it is open. */
const closingOf = (status: BoardStatus | undefined): PlatformView['closing'] => {
  switch (status?.kind) {
    case 'won':
      return status.winner;
    case 'drawn':
      return '=';
    default:
      return null;
  }
};

/** A board's accessible name, which says how it closed. */
const boardLabel = (t: Messages, board: number, status: BoardStatus | undefined): string => {
  switch (status?.kind) {
    case 'won':
      return t.closedWon(board + 1, status.winner);
    case 'drawn':
      return t.closedDrawn(board + 1);
    default:
      return t.board(board + 1);
  }
};

const easingOf = (value: string | undefined): string => {
  const easing = value?.trim() ?? '';
  return easing.length > 0 ? easing : 'ease-in-out';
};

/**
 * The nine numbered platforms. One keyboard entry point: Tab lands on a single roving item and
 * the arrow keys jump to the next legal option in that direction; Escape leaves an open board.
 * On narrow screens boards grow out of, and settle back into, their place in the grid.
 */
@Component({
  selector: 'app-game-board',
  imports: [BoardPlatform, BoardThumbnail, StrikeLine],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
  host: {
    '[class.zoomed]': "mode() === 'zoom'",
    '(window:keydown)': 'onWindowKeydown($event)',
    '(window:pointerdown)': 'onWindowPointerDown()',
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

  /**
   * Revision at which the player last moved between views. A board closed by the last move draws
   * its mark until then; after that it is shown already drawn, however often views are rebuilt.
   */
  private readonly seenAt = signal(-1);
  /** True while the boards around the one being opened fade out. */
  private opening = false;
  /** Settles when the board movement in flight (a move settling, a board opening) has ended. */
  private idle: Promise<void> = Promise.resolve();

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
    const freshBoard = game.revision === this.seenAt() ? null : (last?.board ?? null);
    const motion = !this.preferences.reducedMotion();
    return INDICES.map((board) => {
      const boardStatus = game.boards[board];
      const forced = target.kind === 'forced' && target.board === board;
      const closing = closingOf(boardStatus);
      const fresh = closing !== null && freshBoard === board;
      const win = status.kind === 'won' && status.line.includes(board);
      return {
        board,
        number: String(board + 1),
        label: boardLabel(t, board, boardStatus),
        forced,
        freePick: target.kind === 'free' && playable.has(board),
        playable: playable.has(board),
        closed: boardStatus?.kind !== 'open',
        preview: previewTarget === board,
        win,
        winSpark: motion && win,
        spin: forced ? game.revision : 0,
        closing,
        fresh,
        spark: motion && fresh,
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
    // Against the computer: once its reply lands, the player's forced board opens as after any
    // move. Only schedules; the view changes in the timer.
    let followed = untracked(this.store.opponentMoves);
    effect(() => {
      const replies = this.store.opponentMoves();
      if (replies !== followed) {
        followed = replies;
        untracked(() => this.followOpponent());
      }
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
    // The opponent's turn: the board waits for its reply.
    if (this.store.opponentTurn()) {
      return;
    }
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
    this.track(
      renderChange(this.injector, () => {
        this.store.play(move);
        const target = this.store.game().target;
        stays =
          !this.store.opponentTurn() &&
          target.kind === 'forced' &&
          target.board === board &&
          this.preferences.autoZoom();
        if (stays) {
          this.store.openBoard(board);
        }
      }).then(() => {
        if (stays) {
          this.focusRovingIfKeyboard();
          return;
        }
        return this.settleInto(board, from).then(() => {
          const target = this.store.game().target;
          // Against the computer the next board opens after its reply (`followOpponent`).
          if (this.store.mode() === 'opponent') {
            return;
          }
          if (target.kind !== 'forced' || !this.preferences.autoZoom()) {
            this.focusRovingIfKeyboard();
            return;
          }
          const pause = this.preferences.reducedMotion() ? 0 : PAUSE_BEFORE_OPEN_MS;
          this.pendingOpen = setTimeout(() => this.open(target.board), pause);
        });
      }),
    );
  }

  /**
   * After the opponent's reply: on narrow screens the player's forced board opens as after a move,
   * once the movement in flight (their own move settling into its slot) has ended, so the opening
   * is never swallowed by a board that is still moving.
   */
  private followOpponent(): void {
    clearTimeout(this.pendingOpen);
    if (!this.compact() || !this.preferences.autoZoom()) {
      if (this.usingKeyboard) {
        this.focusRovingAfterRender();
      }
      return;
    }
    void this.idle.then(() => {
      const target = this.store.game().target;
      if (target.kind !== 'forced') {
        this.focusRovingIfKeyboard();
        return;
      }
      const pause = this.preferences.reducedMotion() ? 0 : PAUSE_BEFORE_OPEN_MS;
      this.pendingOpen = setTimeout(() => this.open(target.board), pause);
    });
  }

  /**
   * Opens a board in two beats that never overlap: the other boards fade out, then the board grows
   * out of its slot and the thumbnail fades in as it lands.
   */
  protected open(board: number): void {
    clearTimeout(this.pendingOpen);
    if (this.opening || !this.store.playableBoards().has(board)) {
      return;
    }
    this.markSeen();
    const motion = this.motion();
    const leaving = motion
      ? fadeOut(this.slotsExcept(board), motion, motion.duration * 0.4)
      : { finished: Promise.resolve(), cancel: () => undefined };
    this.opening = true;
    this.track(
      leaving.finished
        .then(() => {
          this.opening = false;
          // The game may have moved on while the others faded (an undo, a restart).
          if (!this.store.playableBoards().has(board)) {
            leaving.cancel();
            return;
          }
          const from = this.slotElement(board)?.getBoundingClientRect();
          return renderChange(this.injector, () => this.store.openBoard(board)).then(() => {
            const zoom = this.zoomElement();
            if (!zoom || !from || !motion) {
              return;
            }
            fadeIn(
              this.host.nativeElement.querySelectorAll('.thumbnail'),
              motion,
              motion.duration * 0.55,
            );
            return flipFrom(zoom, from, motion);
          });
        })
        .then(() => this.focusRovingIfKeyboard()),
    );
  }

  protected back(): void {
    clearTimeout(this.pendingOpen);
    this.markSeen();
    const board = this.zoomed();
    const from = this.zoomElement()?.getBoundingClientRect();
    this.track(
      renderChange(this.injector, () => this.store.showGlobal())
        .then(() => (board === null ? undefined : this.settleInto(board, from)))
        .then(() => {
          if (board !== null) {
            this.roving.set(board);
          }
          this.focusRovingIfKeyboard();
        }),
    );
  }

  /** Records a board movement, so work that must wait for the board to be still can follow it. */
  private track(movement: Promise<unknown>): void {
    this.idle = movement.then(
      () => undefined,
      () => undefined,
    );
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

  /**
   * A pointer switches out of keyboard mode. A method, not an inline `usingKeyboard = false`: a host
   * listener expression that evaluates to false makes Angular call preventDefault(), which cancelled
   * every press on the page and kept text fields from taking focus.
   */
  protected onWindowPointerDown(): void {
    this.usingKeyboard = false;
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

  /**
   * The open board shrinks back into its slot; the other boards fade in only as it lands, so the
   * two movements read one after the other instead of crossing.
   */
  private settleInto(board: number, from: DOMRect | undefined): Promise<void> {
    const slot = this.slotElement(board);
    const motion = this.motion();
    if (!slot || !from || !motion) {
      return Promise.resolve();
    }
    fadeIn(this.slotsExcept(board), motion, motion.duration * 0.6);
    slot.style.zIndex = '2';
    return flipFrom(slot, from, motion).then(() => {
      slot.style.zIndex = '';
    });
  }

  private markSeen(): void {
    this.seenAt.set(this.store.game().revision);
  }

  private slotsExcept(board: number): Element[] {
    const slot = this.slotElement(board);
    return [...this.host.nativeElement.querySelectorAll('[data-board]')].filter(
      (element) => element !== slot,
    );
  }

  private slotElement(board: number): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(`[data-board="${board}"]`);
  }

  private zoomElement(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>('.zoom');
  }

  /** Duration and easing from the `--duration-zoom` and `--ease-zoom` tokens; null without motion. */
  private motion(): FlipOptions | null {
    if (this.preferences.reducedMotion()) {
      return null;
    }
    const style = this.document.defaultView?.getComputedStyle(this.host.nativeElement);
    return {
      duration: Number.parseFloat(style?.getPropertyValue('--duration-zoom') ?? '') || 520,
      easing: easingOf(style?.getPropertyValue('--ease-zoom')),
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
