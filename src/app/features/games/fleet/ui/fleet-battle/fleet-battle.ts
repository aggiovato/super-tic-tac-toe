import { Component, computed, inject } from '@angular/core';
import { FleetStore } from '@fleet/state';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { FleetQuay } from '../fleet-quay/fleet-quay';
import { battleViews } from '../fleet-views';
import { FleetWaters } from '../fleet-waters/fleet-waters';

/**
 * The firing: the enemy waters on a platform (aim with a tap or the arrows, fire with a second
 * tap, Enter or Fire), or this player's own waters while they look at them through the
 * magnifier (the thumbnail on the quay). On phones the rival's trains stand above and this player's quay below; on
 * wide screens they move to the side column and the board takes the arena's height.
 */
@Component({
  selector: 'app-fleet-battle',
  imports: [Button, FleetQuay, FleetWaters],
  templateUrl: './fleet-battle.html',
  styleUrl: './fleet-battle.css',
})
export class FleetBattle {
  protected readonly store = inject(FleetStore);
  protected readonly t = inject(Translator).t;

  protected readonly views = computed(() =>
    battleViews(this.t(), this.store.view(), this.store.me(), this.store.lastShot()),
  );

  /** A tap or Enter on a cell: aims there, or fires when it was aimed already. */
  protected pick(index: number): void {
    if (!this.store.personTurn()) return;
    if (this.store.aimed() === index) {
      this.store.fire();
    } else {
      this.store.aim(index);
    }
  }

  /** The keyboard's focus aims, so Enter fires where the ring is. */
  protected focus(index: number): void {
    if (this.store.personTurn()) this.store.aim(index);
  }
}
