import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { Translator } from '@i18n';
import { Button, Choice } from '@kit';
import { Preferences } from '@preferences';
import { SettingsSheet } from '@shell';

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
  private readonly sheet = inject(SettingsSheet);
  private readonly router = inject(Router);

  /** Asks the page to show the how-to-play ticket again. */
  readonly howToPlay = output();

  /** Closes the sheet first: the ticket is a modal of its own, over the board. */
  protected openHowToPlay(): void {
    this.sheet.close();
    this.howToPlay.emit();
  }

  /** The game under way is saved: leaving for the challenges loses nothing. */
  protected openChallenges(): void {
    this.sheet.close();
    void this.router.navigate(['/super-3t/challenge']);
  }
}
