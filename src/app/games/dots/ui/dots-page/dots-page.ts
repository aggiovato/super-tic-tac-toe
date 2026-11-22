import { afterNextRender, Component, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Preferences } from '@preferences';
import {
  BrandTitle,
  GameActions,
  GameLayout,
  GamesMenu,
  HistoryLink,
  SaveNotice,
  ScoreBoard,
  SettingsSheet,
} from '@shell';
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
})
export class DotsPage {
  protected readonly t = inject(Translator).t;
  protected readonly howToPlay = viewChild.required(DotsHowToPlay);

  constructor() {
    // The store restores the saved match (or starts the saved setup); the app opens here next time.
    const preferences = inject(Preferences);
    preferences.setLastGame('dots');
    // First visit: the how-to-play ticket, once; Settings reopens it.
    afterNextRender(() => {
      if (!preferences.seenTutorials().has('dots')) {
        this.howToPlay().open();
      }
    });
  }
}
