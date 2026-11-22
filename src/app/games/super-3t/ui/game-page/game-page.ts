import { afterNextRender, Component, computed, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Preferences } from '@settings';
import { GameStore } from '@super3t/state';
import {
  BrandTitle,
  GameActions,
  GameLayout,
  HistoryLink,
  SaveNotice,
  ScoreBoard,
  SettingsSheet,
} from '@shell';
import { DeparturePanel } from '../departure-panel/departure-panel';
import { GameBoard } from '../game-board/game-board';
import { HowToPlay } from '../how-to-play/how-to-play';
import { Super3tSettings } from '../super3t-settings/super3t-settings';

/** The game route: lays out the name, the departure panel, the board, the score and the actions. */
@Component({
  selector: 'app-game-page',
  imports: [
    BrandTitle,
    DeparturePanel,
    GameActions,
    GameBoard,
    GameLayout,
    HistoryLink,
    HowToPlay,
    ScoreBoard,
    SaveNotice,
    SettingsSheet,
    Super3tSettings,
  ],
  templateUrl: './game-page.html',
})
export class GamePage {
  protected readonly t = inject(Translator).t;
  protected readonly howToPlay = viewChild.required(HowToPlay);
  private readonly store = inject(GameStore);
  /** Boards won in the current game, for the title's TIP, TAP, TOE. */
  protected readonly wonBoards = computed(
    () => this.store.game().boards.filter((board) => board.kind === 'won').length,
  );

  constructor() {
    // The store restores the saved match (or starts the saved setup); the app opens here next time.
    const preferences = inject(Preferences);
    preferences.setLastGame('super-3t');
    // First visit: the how-to-play ticket, once; Settings reopens it.
    afterNextRender(() => {
      if (!preferences.tutorialSeen()) {
        this.howToPlay().open();
      }
    });
  }
}
