import { Component, computed, inject, input } from '@angular/core';
import { FleetStore } from '@fleet/state';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { FleetTrains } from '../fleet-trains/fleet-trains';
import { battleViews } from '../fleet-views';
import { FleetWaters } from '../fleet-waters/fleet-waters';

/**
 * The fleets on the quay: the rival's trains, and this player's own (trains, a thumbnail of their
 * waters and Fire). On phones the battle stacks them above and below the board (`rival`, `own`);
 * on wide screens the side column holds both (`both`) and the board takes the arena's height.
 */
@Component({
  selector: 'app-fleet-quay',
  imports: [Button, FleetTrains, FleetWaters],
  templateUrl: './fleet-quay.html',
  styleUrl: './fleet-quay.css',
  host: { '[attr.data-part]': 'part()' },
})
export class FleetQuay {
  readonly part = input.required<'rival' | 'own' | 'both'>();

  protected readonly store = inject(FleetStore);
  protected readonly t = inject(Translator).t;

  protected readonly views = computed(() =>
    battleViews(this.t(), this.store.view(), this.store.me(), this.store.lastShot()),
  );
}
