import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ClassicStore } from '@classic/state';
import { Translator } from '@i18n';
import { BoardCell, type CellView, clampSegment, gridStrike, StrikeLine } from '@kit';
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
 * One cell is in the tab order (roving focus); arrows move it, Enter and Space play.
 */
@Component({
  selector: 'app-classic-board',
  imports: [BoardCell, StrikeLine],
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
