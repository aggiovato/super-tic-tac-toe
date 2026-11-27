import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FleetStore } from '@fleet/state';
import { Translator } from '@i18n';
import { playerLabel } from '@layout';
import { Preferences } from '@preferences';
import { Button, Icon } from '@ui';
import { FleetTrains } from '../fleet-trains/fleet-trains';
import { battleViews } from '../fleet-views';
import { FleetWaters } from '../fleet-waters/fleet-waters';

/**
 * The fleets on the quay, read as one board of two equal rows: each fleet's player, named as on
 * their card under the board ("Novato", "Tú"), how many of its
 * ships float and its trains, so the two compare at a glance. Phones stack them around the board
 * (`rival` above; `own` below, with the thumbnail of this player's waters and Fire in the thumb
 * zone while the game goes on). Wide screens hold both in the side column (`both`), the waters
 * under them; Fire then sits where Rematch comes at the end (FleetPage).
 */
@Component({
  selector: 'app-fleet-quay',
  imports: [Button, FleetTrains, FleetWaters, Icon, NgTemplateOutlet],
  templateUrl: './fleet-quay.html',
  styleUrl: './fleet-quay.css',
  host: { '[attr.data-part]': 'part()' },
})
export class FleetQuay {
  readonly part = input.required<'rival' | 'own' | 'both'>();

  protected readonly store = inject(FleetStore);
  protected readonly t = inject(Translator).t;

  private readonly names = inject(Preferences).names;

  /** Each fleet's player, named as on the player cards: this device's, then the rival. */
  protected readonly owners = computed(() => {
    const store = this.store;
    const side = { mode: store.mode(), level: store.level(), seat: store.seat() };
    const own = store.mode() === 'online' ? (store.seat() ?? 0) : 0;
    const label = (participant: 0 | 1) => playerLabel(this.t(), this.names(), side, participant);
    return { own: label(own), rival: label(own === 0 ? 1 : 0) };
  });

  protected readonly views = computed(() =>
    battleViews(this.t(), this.store.view(), this.store.me(), this.store.lastShot()),
  );

  /** The board the thumbnail shows: the one not on the big board. */
  protected readonly thumbnail = computed(() =>
    this.store.lookingAtOwn() ? this.views().enemy : this.views().own,
  );
}
