import { Component, inject, output } from '@angular/core';
import { Translator } from '@i18n';
import { SettingsSheet } from '@layout';
import { Button } from '@ui';

/** Ship Sink's own settings, in the shared sheet's Game tab: how to play. */
@Component({
  selector: 'app-fleet-settings',
  imports: [Button],
  template: `
    <button app-button="secondary" class="w-full" (click)="open()">
      {{ t().settings.howToPlay }}
    </button>
  `,
})
export class FleetSettings {
  protected readonly t = inject(Translator).t;
  private readonly sheet = inject(SettingsSheet);

  /** Asks the page to show the how-to-play ticket again. */
  readonly howToPlay = output();

  protected open(): void {
    this.sheet.close();
    this.howToPlay.emit();
  }
}
