import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ClassicStore } from '@classic/state';
import { Translator } from '@i18n';
import { BoardCell, type CellView, clampSegment, ClosingMark, gridStrike, StrikeLine } from '@ui';
import { Preferences } from '@preferences';
import type { Mark } from '@tictac';

const glyphOf = (mark: Mark): string => (mark === 'X' ? 'x' : mark === 'O' ? 'o' : ' ');

/** Arrow keys move within the 3×3 grid, without wrapping; Home and End jump to its corners. */
const STEPS: Readonly<Record<string, (cell: number) => number>> = {
  ArrowRight: (cell) => (cell % 3 === 2 ? cell : cell + 1),
  ArrowLeft: (cell) => (cell % 3 === 0 ? cell : cell - 1),
  ArrowDown: (cell) => (cell > 5 ? cell : cell + 3),
  ArrowUp: (cell) => (cell < 3 ? cell : cell - 3),
  Home: () => 0,
  End: () => 8,
};

/**
 * The classic board: one 3×3 grid of the same cells, marks and strike line as Super 3T's boards.
 * One cell is in the tab order (roving focus); arrows move it, Enter and Space play. It ends as a
 * Super 3T board closes: the line, then the large mark (the winner's in the win colour, `=` on a
 * draw) and, on a win, the same three flashes as Super 3T's winning boards.
 */
@Component({
  selector: 'app-classic-board',
  imports: [BoardCell, ClosingMark, StrikeLine],
  templateUrl: './classic-board.html',
  styleUrl: './classic-board.css',
})
export class ClassicBoard {
  protected readonly store = inject(ClassicStore);
  protected readonly t = inject(Translator).t;

  protected readonly cells = computed((): readonly CellView[] => {
    const { cells } = this.store.game();
    const legal = new Set(this.store.legal().map((move) => move.cell));
    const last = this.store.lastMove()?.cell;
    return cells.map((mark, cell) => ({
      cell,
      mark,
      glyph: glyphOf(mark),
      legal: legal.has(cell),
      last: cell === last,
      label: this.t().classic.cell(cell + 1, mark),
      roving: cell,
    }));
  });

  /** The winning line, through the centres of its cells. */
  protected readonly strike = computed(() => {
    const status = this.store.game().status;
    return status.kind === 'won' ? clampSegment(gridStrike(status.line)) : null;
  });

  /** The large mark over the finished board: the winner's, or `=` for a draw. */
  protected readonly closing = computed((): 'X' | 'O' | '=' | null => {
    const status = this.store.game().status;
    return status.kind === 'won' ? status.winner : status.kind === 'drawn' ? '=' : null;
  });

  protected readonly won = computed(() => this.store.game().status.kind === 'won');

  /** Whether this board saw the game under way: a game restored already over ends without a show. */
  private readonly sawPlay = linkedSignal<boolean, boolean>({
    source: () => this.store.isOver(),
    computation: (over, previous) => !over || (previous?.value ?? false),
  });

  /**
   * The game just ended here: the large mark draws on. `sawPlay` is read first, on every change,
   * so it records the game under way before it ends.
   */
  protected readonly fresh = computed(() => this.sawPlay() && this.store.isOver());

  /** A win just made, motion allowed: the board flashes three times. */
  protected readonly celebrate = computed(
    () => this.fresh() && this.won() && !this.reducedMotion(),
  );

  private readonly reducedMotion = inject(Preferences).reducedMotion;

  /** The cell in the tab order: the last one played, or the centre. */
  protected readonly roving = linkedSignal(() => this.store.lastMove()?.cell ?? 4);

  protected play(cell: number): void {
    this.roving.set(cell);
    this.store.play({ cell });
  }

  protected onKey(event: KeyboardEvent, host: HTMLElement): void {
    const step = STEPS[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    const cell = step(this.roving());
    this.roving.set(cell);
    host.querySelector<HTMLElement>(`[data-roving="${cell}"]`)?.focus();
  }
}
