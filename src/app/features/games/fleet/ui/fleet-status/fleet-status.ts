import { Component, computed, inject } from '@angular/core';
import { BOARD_SIZE, shotsInOrder } from '@fleet/core';
import { FleetStore, type LastShot } from '@fleet/state';
import { Translator } from '@i18n';
import { participantName } from '@layout';
import type { Participant } from '@match';
import { Preferences } from '@preferences';
import { DepartureBoard, type FlapTile } from '@ui';
import { afloat, cellName } from '../fleet-views';

/** The result cascades through more characters than an ordinary announcement. */
const RESULT_STEPS = 14;

const word = (text: string, extra: Partial<FlapTile> = {}): FlapTile[] =>
  [...text].map((char) => ({ char, accent: false, ...extra }));

/**
 * Ship Sink's status: a departure row announcing the last shot and what it did ("F4 TOCADO"), or
 * the phase, or the result; one sentence under it; and what screen readers hear after each change.
 */
@Component({
  selector: 'app-fleet-status',
  imports: [DepartureBoard],
  templateUrl: './fleet-status.html',
  styleUrl: './fleet-status.css',
})
export class FleetStatus {
  protected readonly store = inject(FleetStore);
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);

  /** The rival's name: the computer's train, or "Rival" online. */
  private readonly rivalName = computed(() => {
    const person = this.store.person();
    const rival: Participant = person === 0 ? 1 : 0;
    const side = { mode: this.store.mode(), level: this.store.level(), seat: this.store.seat() };
    return (
      participantName(this.t(), this.preferences.names(), side, rival) ?? this.t().online.rival
    );
  });

  private readonly won = computed((): boolean | null => {
    const { status } = this.store.view();
    return status.kind === 'won' ? status.winner === this.store.me() : null;
  });

  protected readonly tiles = computed((): FlapTile[] => {
    const flap = this.t().fleet.flap;
    const view = this.store.view();
    const won = this.won();
    if (won !== null) {
      // The win in Apricot, as across the family; a defeat stays plain.
      return word(won ? flap.won : flap.lost, { accent: won, steps: RESULT_STEPS });
    }
    if (view.phase === 'placing') return word(flap.fleet);
    const last = this.store.lastShot();
    if (!last) return word(flap.fire);
    // The cell and what the shot did; who fired is said in the sentence below (a symbol here read
    // as a hit's cross).
    const cell = word(cellName(last.shot));
    const { outcome } = last.shot;
    if (outcome === 'pending') return [...cell, { char: ' ', accent: false }, ...word('···')];
    const said = outcome === 'water' ? flap.water : outcome === 'hit' ? flap.hit : flap.sunk;
    // A hit and a sinking in the hit's own ink (Sand); the cell in plain flaps.
    const ink = outcome === 'water' ? {} : { ink: 'hit' as const };
    return [...cell, { char: ' ', accent: false }, ...word(said, ink)];
  });

  /** One sentence: a refusal, the result, the phase, the aimed cell or what the last shot did. */
  protected readonly why = computed((): string => {
    const f = this.t().fleet;
    const view = this.store.view();
    const rejection = this.store.lastRejection();
    if (rejection) return f.rejected(rejection);
    const won = this.won();
    if (won !== null) return won ? f.won(this.rivalName()) : f.lost(this.rivalName());
    if (view.phase === 'placing') {
      return view.placed[this.store.me()] ? f.waitingFleet(this.rivalName()) : f.placing;
    }
    const aimed = this.store.aimed();
    const last = this.store.lastShot();
    if (aimed !== null) {
      const at = cellName({ row: Math.floor(aimed / BOARD_SIZE), col: aimed % BOARD_SIZE });
      // The turn came back after the rival missed: the row still shows that miss, so say it.
      return last && last.by !== this.store.me()
        ? f.aimingAfterMiss(this.rivalName(), cellName(last.shot), at)
        : f.aiming(at);
    }
    if (!last) return this.store.personTurn() ? f.yourTurn : f.rivalTurn(this.rivalName());
    return this.shotSentence(last);
  });

  /** What the last shot did, said from this player's side. */
  private shotSentence({ by, shot }: LastShot): string {
    const f = this.t().fleet;
    const name = cellName(shot);
    if (shot.outcome === 'pending') return f.pending(name);
    const ship = shot.sunk ? f.ships[shot.sunk.ship] : '';
    if (by === this.store.me()) return f.yourShot(name, shot.outcome, ship);
    const rival = f.rivalShot(this.rivalName(), name, shot.outcome, ship);
    // The turn came back: what this player's own last shot did is said again before the rival's.
    const mine = shotsInOrder(this.store.view())
      .filter((fired) => fired.by === this.store.me())
      .at(-1);
    return mine && shot.outcome === 'water' && mine.shot.outcome === 'water'
      ? `${f.yourMiss(cellName(mine.shot))} ${rival}`
      : rival;
  }

  /** What screen readers hear: the sentence and the ships each side has afloat. */
  protected readonly status = computed((): string => {
    const f = this.t().fleet;
    const view = this.store.view();
    if (view.phase === 'placing') return this.why();
    const mine = afloat(view, this.store.rival());
    const theirs = afloat(view, this.store.me());
    return `${this.why()} ${f.rivalFleet}: ${f.afloat(theirs)}. ${f.yourFleet}: ${f.afloat(mine)}.`;
  });
}
