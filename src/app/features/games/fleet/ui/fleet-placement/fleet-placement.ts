import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import {
  BOARD_SIZE,
  type Fleet,
  fleetProblem,
  type FleetProblem,
  randomFleet,
  shipAt,
  type ShipId,
} from '@fleet/core';
import { FleetStore } from '@fleet/state';
import { Translator } from '@i18n';
import { createRandom } from '@tictac';
import { Button } from '@ui';
import { overlay, waterCells } from '../fleet-views';
import { FleetWaters } from '../fleet-waters/fleet-waters';

/** Mixed into the game's seed so the person's first fleet is not the computer's. */
const PERSON_SALT = 0x5bd1e995;

/**
 * The quick placement: the fleet arrives placed at random. A tap on a ship picks it, a tap on the
 * water moves its bow there, Turn rotates it, Shuffle deals a new fleet, Confirm places it. By
 * keyboard: arrows move over the board, Enter picks or moves, R turns. A move that breaks a rule is
 * not made, and the sentence under the board says why.
 */
@Component({
  selector: 'app-fleet-placement',
  imports: [Button, FleetWaters],
  templateUrl: './fleet-placement.html',
  styleUrl: './fleet-placement.css',
  // R turns the chosen ship wherever focus is in the placement.
  host: { '(keydown)': 'onKey($event)' },
})
export class FleetPlacement {
  protected readonly store = inject(FleetStore);
  protected readonly t = inject(Translator).t;

  /** The fleet being arranged: a new random one with every game (the same after a reload). */
  protected readonly draft = linkedSignal<string, Fleet>({
    source: () => this.store.id(),
    computation: () => randomFleet(createRandom((this.store.seed() ^ PERSON_SALT) >>> 0)),
  });
  protected readonly selected = signal<ShipId | null>('carrier');
  protected readonly problem = signal<FleetProblem | null>(null);

  /** Placed already: the fleet waits for the rival's, and can no longer change. */
  protected readonly placed = computed(() => this.store.view().placed[this.store.me()]);
  private readonly shown = computed(
    () => this.store.view().fleets[this.store.me()] ?? this.draft(),
  );

  /** The board, with the water around each ship: where no other ship may be placed. */
  protected readonly cells = computed(() =>
    waterCells(this.t(), { fleet: this.shown(), shots: [], rims: true }),
  );
  protected readonly ships = computed(() =>
    this.shown().map((ship) => overlay(ship, !this.placed() && ship.ship === this.selected())),
  );

  protected pick(index: number): void {
    if (this.placed()) return;
    const cell = { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
    const ship = shipAt(this.draft(), cell);
    if (ship) {
      this.selected.set(ship.ship);
      this.problem.set(null);
      return;
    }
    const chosen = this.selected();
    if (chosen) this.change((p) => (p.ship === chosen ? { ...p, ...cell } : p));
  }

  protected rotate(): void {
    const chosen = this.selected();
    if (chosen && !this.placed()) {
      this.change((p) =>
        p.ship === chosen ? { ...p, orientation: p.orientation === 'h' ? 'v' : 'h' } : p,
      );
    }
  }

  protected shuffle(): void {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
    this.draft.set(randomFleet(createRandom(seed)));
    this.problem.set(null);
  }

  protected confirm(): void {
    this.store.play({ kind: 'place', player: this.store.me(), fleet: this.draft() });
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.rotate();
    }
  }

  /** Changes the draft when the result is a legal fleet; otherwise says why it is not. */
  private change(edit: (placement: Fleet[number]) => Fleet[number]): void {
    const next = this.draft().map(edit);
    const problem = fleetProblem(next);
    this.problem.set(problem);
    if (!problem) this.draft.set(next);
  }
}
