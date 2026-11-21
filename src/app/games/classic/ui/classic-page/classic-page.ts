import { Component, inject } from '@angular/core';
import { ClassicStore } from '@classic/state';
import { Translator } from '@i18n';
import { Preferences } from '@settings';
import { BrandTitle, GameActions, GameLayout, ScoreBoard, SettingsSheet } from '@shell';
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
    ScoreBoard,
    SettingsSheet,
  ],
  templateUrl: './classic-page.html',
})
export class ClassicPage {
  protected readonly t = inject(Translator).t;

  constructor() {
    // The saved mode and level shape the first series, and the app opens here next time.
    const preferences = inject(Preferences);
    const { mode, level } = preferences.play().classic;
    inject(ClassicStore).setMode(mode, level);
    preferences.setLastGame('classic');
  }
}
