import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { BOARD_SIZE } from '@fleet/core';
import { COL_NAMES, ROW_NAMES } from '../fleet-views';
import type { ShipOverlay, WaterCell } from './fleet-waters.model';

/** Keys that move the roving focus, as steps on the board. */
const STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -BOARD_SIZE,
  ArrowDown: BOARD_SIZE,
};

/**
 * One 10×10 board of Ship Sink: rows A–J and columns 1–10 around it, each cell's mark (water, a hit,
 * a sunk ship's wreck), ships drawn over it and the aimed cell in Apricot. Interactive, each cell is
 * a native button with one in the tab order: arrows move between cells (and report the cell, so
 * focus can aim), Home and End jump to the corners, Enter or a tap picks it. Compact, it is a
 * picture for the eye only: its owner says what it shows in words.
 */
@Component({
  selector: 'app-fleet-waters',
  templateUrl: './fleet-waters.html',
  styleUrl: './fleet-waters.css',
  // A thumbnail is for the eye only: its owner says in words what it shows.
  host: {
    '[class.compact]': 'compact()',
    '[class.platform]': 'platform()',
    '[class.won]': 'won()',
    '[class.celebrate]': 'celebrate()',
    '[attr.aria-hidden]': 'compact() || null',
  },
})
export class FleetWaters {
  readonly cells = input.required<readonly WaterCell[]>();
  readonly label = input.required<string>();
  readonly ships = input<readonly ShipOverlay[]>([]);
  /** Sunk ships, outlined in Chalk. */
  readonly wrecks = input<readonly ShipOverlay[]>([]);
  readonly aimed = input<number | null>(null);
  readonly interactive = input(false);
  /** A thumbnail: no labels, no input, hidden from screen readers. */
  readonly compact = input(false);
  /** On a raised platform with the panel lift, as the family's boards stand. */
  readonly platform = input(false);
  /** Every ship here is sunk and the game won: the winner's figure, in the win colour. */
  readonly won = input(false);
  /** The winning shot was just fired: the figure flashes three times. */
  readonly celebrate = input(false);

  /** A cell tapped, or Enter or Space on it. */
  readonly picked = output<number>();
  /** The keyboard moved to a cell. */
  readonly focused = output<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The aimed cell's row and column, whose labels light up with it. */
  protected readonly aimedRow = computed(() => {
    const aimed = this.aimed();
    return aimed === null ? -1 : Math.floor(aimed / BOARD_SIZE);
  });
  protected readonly aimedCol = computed(() => {
    const aimed = this.aimed();
    return aimed === null ? -1 : aimed % BOARD_SIZE;
  });

  protected readonly rows = ROW_NAMES;
  protected readonly cols = COL_NAMES;
  /** Grid lines are counted from 1, past the label row and column when there are labels. */
  protected readonly offset = computed(() => (this.compact() ? 1 : 2));

  /** The cell in the tab order: the aimed one, else the first not fired at. */
  protected readonly roving = linkedSignal(
    () =>
      this.aimed() ??
      this.cells().find((cell) => cell.state === 'unknown' || cell.state === 'ship')?.index ??
      0,
  );

  protected onKey(event: KeyboardEvent): void {
    const from = this.roving();
    const step = STEPS[event.key];
    let to: number | null = null;
    if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = BOARD_SIZE * BOARD_SIZE - 1;
    else if (step !== undefined) {
      const next = from + step;
      const sameRow = Math.floor(next / BOARD_SIZE) === Math.floor(from / BOARD_SIZE);
      const inside = next >= 0 && next < BOARD_SIZE * BOARD_SIZE;
      to = inside && (Math.abs(step) === BOARD_SIZE || sameRow) ? next : null;
    }
    if (to === null) return;
    event.preventDefault();
    this.roving.set(to);
    this.host.nativeElement.querySelector<HTMLElement>(`[data-cell="${to}"]`)?.focus();
    this.focused.emit(to);
  }

  protected pick(index: number): void {
    this.roving.set(index);
    this.picked.emit(index);
  }

  protected span(ship: ShipOverlay, axis: 'row' | 'col'): string {
    const start = (axis === 'row' ? ship.row : ship.col) + this.offset();
    const along = (ship.orientation === 'h') === (axis === 'col');
    return `${start} / span ${along ? ship.length : 1}`;
  }
}
