import { ActivatedRoute } from '@angular/router';
import { afterNextRender, Component, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Preferences } from '@preferences';
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
import { DotsBoard } from '../dots-board/dots-board';
import { DotsHowToPlay } from '../dots-how-to-play/dots-how-to-play';
import { DotsSettings } from '../dots-settings/dots-settings';
import { DotsStatus } from '../dots-status/dots-status';

/** The Dots and Boxes route (`/dots`): the shared game layout around the dot board. */
@Component({
  selector: 'app-dots-page',
  imports: [
    BrandTitle,
    DotsBoard,
    DotsHowToPlay,
    DotsSettings,
    DotsStatus,
    GameActions,
    GameLayout,
    GamesMenu,
    HistoryLink,
    SaveNotice,
    ScoreBoard,
    SettingsSheet,
  ],
  templateUrl: './dots-page.html',
  // On an upright phone the arena keeps room for the board at full width (square).
  styles: ':host { --game-arena-min: calc(100vw - 2 * var(--spacing-gutter)); }',
})
export class DotsPage {
  protected readonly t = inject(Translator).t;
  protected readonly howToPlay = viewChild.required(DotsHowToPlay);

  constructor() {
    // The store restores the saved match (or starts the saved setup); the app opens here next time.
    const preferences = inject(Preferences);
    preferences.setLastGame('dots');
    // First visit: the how-to-play ticket, once; Settings reopens it. Not over a ticket of its own
    // route (the history, opened by a link): that one was asked for.
    const route = inject(ActivatedRoute);
    afterNextRender(() => {
      if (!preferences.seenTutorials().has('dots') && !route.snapshot.firstChild?.data['overlay']) {
        this.howToPlay().open();
      }
    });
  }
}
