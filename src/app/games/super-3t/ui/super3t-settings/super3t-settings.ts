import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { Translator } from '@i18n';
import { Button, Choice } from '@kit';
import { Preferences } from '@settings';
import { SettingsSheet, TwoPress } from '@shell';
import { GameStore } from '@super3t/state';

/**
 * Super 3T's own settings, projected into the shared sheet's Game tab: how to play, the tactical
 * challenges, hints and opening the forced board.
 */
@Component({
  selector: 'app-super3t-settings',
  imports: [Button, Choice],
  templateUrl: './super3t-settings.html',
  styleUrl: './super3t-settings.css',
})
export class Super3tSettings {
  protected readonly t = inject(Translator).t;
  protected readonly preferences = inject(Preferences);
  private readonly store = inject(GameStore);
  private readonly sheet = inject(SettingsSheet);
  private readonly router = inject(Router);

  /** Asks the page to show the how-to-play ticket again. */
  readonly howToPlay = output();

  /** Leaving for the challenges drops a game under way (until phase 4 saves it): asks once more. */
  protected readonly leave = new TwoPress();

  /** Closes the sheet first: the ticket is a modal of its own, over the board. */
  protected openHowToPlay(): void {
    this.sheet.close();
    this.howToPlay.emit();
  }

  protected openChallenges(): void {
    if (this.store.seriesStarted() && !this.leave.press()) {
      return;
    }
    this.sheet.close();
    void this.router.navigate(['/super-3t/challenge']);
  }
}
