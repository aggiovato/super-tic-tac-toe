import { afterNextRender, Component, computed, inject, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FleetStore } from '@fleet/state';
import { Translator } from '@i18n';
import {
  BrandTitle,
  GameActions,
  GameLayout,
  HistoryLink,
  SaveNotice,
  ScoreBoard,
  SettingsSheet,
} from '@layout';
import { GamesMenu } from '@library';
import { Preferences } from '@preferences';
import { FleetBattle } from '../fleet-battle/fleet-battle';
import { FleetHowToPlay } from '../fleet-how-to-play/fleet-how-to-play';
import { FleetPlacement } from '../fleet-placement/fleet-placement';
import { FleetQuay } from '../fleet-quay/fleet-quay';
import { FleetSettings } from '../fleet-settings/fleet-settings';
import { FleetStatus } from '../fleet-status/fleet-status';

/**
 * The Ship Sink route (`/fleet`): the shared game layout around the fleet quay. While the fleets
 * are placed the arena holds this player's waters; then the battle.
 */
@Component({
  selector: 'app-fleet-page',
  imports: [
    BrandTitle,
    FleetBattle,
    FleetHowToPlay,
    FleetPlacement,
    FleetQuay,
    FleetSettings,
    FleetStatus,
    GameActions,
    GameLayout,
    GamesMenu,
    HistoryLink,
    SaveNotice,
    ScoreBoard,
    SettingsSheet,
  ],
  templateUrl: './fleet-page.html',
  styleUrl: './fleet-page.css',
})
export class FleetPage {
  protected readonly t = inject(Translator).t;
  protected readonly howToPlay = viewChild.required(FleetHowToPlay);
  private readonly store = inject(FleetStore);
  protected readonly placing = computed(() => this.store.view().phase === 'placing');

  constructor() {
    const preferences = inject(Preferences);
    preferences.setLastGame('fleet');
    // First visit: the how-to-play ticket, once; Settings reopens it. Not over a ticket of its own
    // route (the history, opened by a link): that one was asked for.
    const route = inject(ActivatedRoute);
    afterNextRender(() => {
      if (
        !preferences.seenTutorials().has('fleet') &&
        !route.snapshot.firstChild?.data['overlay']
      ) {
        this.howToPlay().open();
      }
    });
  }
}
