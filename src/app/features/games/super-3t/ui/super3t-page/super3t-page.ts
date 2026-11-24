import { ActivatedRoute } from '@angular/router';
import { afterNextRender, Component, computed, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Preferences } from '@preferences';
import { Super3tStore } from '@super3t/state';
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
import { DeparturePanel } from '../departure-panel/departure-panel';
import { Super3tBoard } from '../super3t-board/super3t-board';
import { HowToPlay } from '../how-to-play/how-to-play';
import { Super3tSettings } from '../super3t-settings/super3t-settings';

/** The game route: lays out the name, the departure panel, the board, the score and the actions. */
@Component({
  selector: 'app-super3t-page',
  imports: [
    BrandTitle,
    DeparturePanel,
    GameActions,
    Super3tBoard,
    GameLayout,
    GamesMenu,
    HistoryLink,
    HowToPlay,
    ScoreBoard,
    SaveNotice,
    SettingsSheet,
    Super3tSettings,
  ],
  templateUrl: './super3t-page.html',
})
export class Super3tPage {
  protected readonly t = inject(Translator).t;
  protected readonly howToPlay = viewChild.required(HowToPlay);
  private readonly store = inject(Super3tStore);
  /** Boards won in the current game, for the title's TIP, TAP, TOE. */
  protected readonly wonBoards = computed(() =>
    // Not before the saved game is back: its boards were won before, not now.
    this.store.ready()
      ? this.store.game().boards.filter((board) => board.kind === 'won').length
      : null,
  );

  constructor() {
    // The store restores the saved match (or starts the saved setup); the app opens here next time.
    const preferences = inject(Preferences);
    preferences.setLastGame('super-3t');
    // First visit: the how-to-play ticket, once; Settings reopens it. Not over a ticket of its own
    // route (the history, opened by a link): that one was asked for.
    const route = inject(ActivatedRoute);
    afterNextRender(() => {
      if (
        !preferences.seenTutorials().has('super-3t') &&
        !route.snapshot.firstChild?.data['overlay']
      ) {
        this.howToPlay().open();
      }
    });
  }
}
