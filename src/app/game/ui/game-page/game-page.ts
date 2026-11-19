import { Component, inject } from '@angular/core';
import { Translator } from '@i18n';
import { Preferences } from '@settings';
import { GameStore } from '@state';
import { Backdrop } from '@kit';
import { BrandTitle } from '../brand-title/brand-title';
import { DeparturePanel } from '../departure-panel/departure-panel';
import { GameActions } from '../game-actions/game-actions';
import { GameBoard } from '../game-board/game-board';
import { ScoreBoard } from '../score-board/score-board';
import { SettingsPanel } from '../settings-panel/settings-panel';

/** The game route: lays out the name, the departure panel, the board, the score and the actions. */
@Component({
  selector: 'app-game-page',
  imports: [
    Backdrop,
    BrandTitle,
    DeparturePanel,
    GameActions,
    GameBoard,
    ScoreBoard,
    SettingsPanel,
  ],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage {
  protected readonly t = inject(Translator).t;

  constructor() {
    // The saved mode and level (two people or against the computer) shape the first series.
    const preferences = inject(Preferences);
    inject(GameStore).setMode(preferences.mode(), preferences.level());
  }
}
