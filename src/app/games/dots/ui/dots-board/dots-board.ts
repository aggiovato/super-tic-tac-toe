import {
  Component,
  computed,
  ElementRef,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { boxesBeside, type Player, sameMove } from '@dots/core';
import { DotsStore } from '@dots/state';
import { Translator } from '@i18n';
import { ClosingMark } from '@kit';
import { Preferences } from '@settings';
import { participantName } from '@shell';
import { nearestSlot, nextSlot, slotsOf } from './dots-geometry';
import type { LineSlot } from './line-slot.model';

interface LineView extends LineSlot {
  readonly owner: Player | null;
  readonly label: string;
  /** Drawn since this board appeared: it grows in (a restored game shows still). */
  readonly fresh: boolean;
  readonly last: boolean;
  /** A side of one of the winner's boxes once the game is over, whoever drew it. */
  readonly winning: boolean;
}

interface BoxView {
  readonly index: number;
  readonly left: number;
  readonly top: number;
  readonly owner: Player;
  readonly fresh: boolean;
  /** One of the winner's boxes once the game is over. */
  readonly winning: boolean;
  /** A winning box when the winning line was just drawn: it flashes, as Super 3T's boards. */
  readonly celebrate: boolean;
}

/**
 * The Dots and Boxes board: dots, the lines between them and the boxes. A tap or click draws the
 * line nearest the pointer (lines are thin; neighbouring hit areas would overlap at the dots), and
 * the same line is previewed under the pointer. Each line is also a native button for the keyboard
 * and screen readers: one is in the tab order, arrows move between lines, Home and End jump to the
 * first and last. Only what happens after the board appears is animated.
 */
@Component({
  selector: 'app-dots-board',
  imports: [ClosingMark],
  templateUrl: './dots-board.html',
  styleUrl: './dots-board.css',
})
export class DotsBoard {
  protected readonly store = inject(DotsStore);
  protected readonly t = inject(Translator).t;
  /** Who plays: the opponent is named after its level. */
  private readonly side = computed(() => ({ mode: this.store.mode(), level: this.store.level() }));
  private readonly preferences = inject(Preferences);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Moves already on the board when it appeared, or when a new game began: drawn without motion. */
  private readonly settled = linkedSignal({
    source: () => this.store.id(),
    computation: () => untracked(() => this.store.game().moves.length),
  });

  protected readonly size = computed(() => this.store.size());
  private readonly slots = computed(() => slotsOf(this.size()));
  protected readonly dots = computed(() =>
    Array.from({ length: (this.size() + 1) ** 2 }, (_, i) => ({
      left: (i % (this.size() + 1)) * (100 / this.size()),
      top: Math.floor(i / (this.size() + 1)) * (100 / this.size()),
    })),
  );

  /** The winner once the game is over (null while it goes on, or for a draw). */
  protected readonly winner = computed((): Player | null => {
    const status = this.store.game().status;
    return status.kind === 'won' ? status.winner : null;
  });

  /** The free line under the pointer, previewed in dotted Chalk. */
  protected readonly hovered = signal<string | null>(null);

  /** Who a player is in sentences: their name, otherwise their symbol. */
  private who(player: Player): string {
    const x = this.store.xPlayer();
    const participant = player === 'X' ? x : x === 0 ? 1 : 0;
    return participantName(this.t(), this.preferences.names(), this.side(), participant) ?? player;
  }

  protected readonly lines = computed((): readonly LineView[] => {
    const game = this.store.game();
    const order = new Map(
      game.moves.map((move, i) => [`${move.orientation}${move.row}-${move.col}`, i]),
    );
    const settled = this.settled();
    const last = this.store.lastMove();
    const winner = this.winner();
    const won = new Set(
      winner ? game.boxes.flatMap((owner, index) => (owner === winner ? [index] : [])) : [],
    );
    return this.slots().map((slot) => {
      const lines = slot.move.orientation === 'h' ? game.h : game.v;
      const width = slot.move.orientation === 'h' ? game.size : game.size + 1;
      const owner = lines[slot.move.row * width + slot.move.col] ?? null;
      return {
        ...slot,
        owner,
        label: this.t().dots.line(
          slot.move.orientation,
          slot.move.row + 1,
          slot.move.col + 1,
          owner && this.who(owner),
        ),
        fresh: (order.get(slot.key) ?? -1) >= settled,
        last: last !== null && sameMove(last, slot.move),
        winning: boxesBeside(game.size, slot.move).some((box) => won.has(box)),
      };
    });
  });

  private readonly free = computed(() =>
    this.lines().filter((line) => !line.owner && this.store.isLegal(line.move)),
  );

  protected readonly boxes = computed((): readonly BoxView[] => {
    const game = this.store.game();
    const step = 100 / game.size;
    const winner = game.status.kind === 'won' ? game.status.winner : null;
    // A box is fresh when the line that closed it is fresh.
    const fresh = new Set(
      game.moves.slice(this.settled()).flatMap((move) => boxesBeside(game.size, move)),
    );
    return game.boxes.flatMap((owner, index) =>
      owner
        ? [
            {
              index,
              left: (index % game.size) * step,
              top: Math.floor(index / game.size) * step,
              owner,
              fresh: fresh.has(index),
              winning: owner === winner,
              celebrate: owner === winner && game.moves.length > this.settled(),
            },
          ]
        : [],
    );
  });

  /**
   * The line in the tab order: a free line nearest the last one drawn (Tab never lands on a drawn
   * line), the first line otherwise.
   */
  protected readonly roving = linkedSignal(() => {
    const last = this.lines().find((line) => line.last);
    const free = this.free();
    const near = last && nearestSlot(free, last.x, last.y, Infinity);
    return (near ?? free[0] ?? this.slots()[0])?.key ?? '';
  });

  /** A tap or click: the line nearest the pointer, within half a box. */
  protected onPointer(event: PointerEvent, field: HTMLElement, draw: boolean): void {
    const slot = this.slotAt(event, field);
    this.hovered.set(slot?.key ?? null);
    if (draw && slot) {
      this.play(slot);
    }
  }

  /** Enter or Space on a focused line (a click with no pointer). */
  protected onActivate(event: MouseEvent, line: LineView): void {
    if (event.detail === 0) {
      this.play(line);
    }
  }

  protected onKey(event: KeyboardEvent): void {
    const slots = this.slots();
    const from = slots.find((slot) => slot.key === this.roving());
    const to =
      event.key === 'Home'
        ? slots[0]
        : event.key === 'End'
          ? slots.at(-1)
          : from && nextSlot(slots, from, event.key);
    if (!to) {
      return;
    }
    event.preventDefault();
    this.roving.set(to.key);
    this.host.nativeElement.querySelector<HTMLElement>(`[data-line="${to.key}"]`)?.focus();
  }

  /**
   * The tab stop follows the game (a free line near the last drawn): it is not set here, so a
   * refused line (pressed twice, already drawn) can never leave it on a drawn line.
   */
  private play(slot: LineSlot): void {
    this.store.play(slot.move);
  }

  private slotAt(event: PointerEvent, field: HTMLElement): LineSlot | null {
    const box = field.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    return nearestSlot(this.free(), x, y, 50 / this.size());
  }
}
