import { Component, inject } from '@angular/core';
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
} from '@shell';
import { GamesMenu } from '@library';
import { ClassicBoard } from '../classic-board/classic-board';
import { ClassicStatus } from '../classic-status/classic-status';

/** The classic route (`/classic`): the shared game layout around one 3×3 board. */
@Component({
  selector: 'app-classic-page',
  imports: [
    BrandTitle,
    ClassicBoard,
    ClassicStatus,
    GameActions,
    GameLayout,
    GamesMenu,
    HistoryLink,
    ScoreBoard,
    SaveNotice,
    SettingsSheet,
  ],
  templateUrl: './classic-page.html',
})
export class ClassicPage {
  protected readonly t = inject(Translator).t;

  constructor() {
    // The store restores the saved match (or starts the saved setup); the app opens here next time.
    inject(Preferences).setLastGame('classic');
  }
}
