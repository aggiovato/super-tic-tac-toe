import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
} from '@angular/core';
import type { Mark, Move } from '@core';
import { Translator } from '@i18n';
import { GameStore } from '@state';

/** How the board is played right now. */
type Mode =
  /** Wide layout: every cell is a button. */
  | 'direct'
  /** Narrow layout, global view: pick a board to zoom into. */
  | 'pick'
  /** Narrow layout, one board zoomed with a thumbnail of the whole game. */
  | 'zoom';

const INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Index of a cell in the 9×9 reading order of the whole board. */
const globalIndex = (board: number, cell: number): number =>
  (Math.floor(board / 3) * 3 + Math.floor(cell / 3)) * 9 + (board % 3) * 3 + (cell % 3);

/**
 * The nine numbered platforms. One keyboard entry point: Tab lands on a single roving item and
 * the arrow keys move through the grid of the current mode; Escape leaves a zoomed board.
 */
@Component({
  selector: 'app-game-board',
  imports: [NgTemplateOutlet],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
})
export class GameBoard {
  protected readonly store = inject(GameStore);
  protected readonly t = inject(Translator).t;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly indices = INDICES;
  protected readonly globalIndex = globalIndex;

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

  protected winnerOf(board: number): Mark {
    const status = this.store.game().boards[board];
    return status?.kind === 'won' ? status.winner : null;
  }

  protected isWinningBoard(board: number): boolean {
    const status = this.store.game().status;
    return status.kind === 'won' && status.line.includes(board);
  }

  protected boardLabel(board: number): string {
    const status = this.store.game().boards[board];
    const t = this.t();
    if (status?.kind === 'won') {
      return t.closedWon(board, status.winner);
    }
    return status?.kind === 'drawn' ? t.closedDrawn(board) : t.board(board);
  }

  protected play(board: number, cell: number): void {
    if (!this.isLegal(board, cell)) {
      return;
    }
    this.store.play({ board, cell });
    this.focusRovingAfterRender();
  }

  protected open(board: number): void {
    if (!this.store.playableBoards().has(board)) {
      return;
    }
    this.store.openBoard(board);
    this.focusRovingAfterRender();
  }

  protected back(): void {
    const board = this.zoomed();
    this.store.showGlobal();
    if (board !== null) {
      this.roving.set(board);
    }
    this.focusRovingAfterRender();
  }

  protected preview(move: Move | null): void {
    this.store.setPreview(move && this.isLegal(move.board, move.cell) ? move : null);
  }

  /** Previews follow a mouse; a tap plays at once, so touch never previews. */
  protected onPointerEnter(event: PointerEvent, move: Move): void {
    if (event.pointerType === 'mouse') {
      this.preview(move);
    }
  }

  /** Keyboard focus previews; focus moved by the app after a tap or click does not. */
  protected onFocusItem(event: FocusEvent, index: number, move: Move): void {
    this.roving.set(index);
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
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
    const size = this.mode() === 'direct' ? 9 : 3;
    const index = this.roving();
    const clamp = (value: number): number => Math.min(size - 1, Math.max(0, value));
    const row = clamp(Math.floor(index / size) + delta[0]);
    const col = clamp((index % size) + delta[1]);
    this.roving.set(row * size + col);
    this.focusRoving();
  }

  private focusRoving(): void {
    this.host.nativeElement.querySelector<HTMLElement>(`[data-roving="${this.roving()}"]`)?.focus();
  }

  private focusRovingAfterRender(): void {
    afterNextRender({ write: () => this.focusRoving() }, { injector: this.injector });
  }
}
