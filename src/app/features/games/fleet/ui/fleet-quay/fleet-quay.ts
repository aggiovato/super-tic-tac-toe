import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { FleetStore } from '@fleet/state';
import { Translator } from '@i18n';
import { Button, Icon } from '@ui';
import { FleetTrains } from '../fleet-trains/fleet-trains';
import { battleViews } from '../fleet-views';
import { FleetWaters } from '../fleet-waters/fleet-waters';

/**
 * The fleets on the quay, read as one board of two equal rows: each fleet's name, how many of its
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

  protected readonly views = computed(() =>
    battleViews(this.t(), this.store.view(), this.store.me(), this.store.lastShot()),
  );

  /** The board the thumbnail shows: the one not on the big board. */
  protected readonly thumbnail = computed(() =>
    this.store.lookingAtOwn() ? this.views().enemy : this.views().own,
  );
}
