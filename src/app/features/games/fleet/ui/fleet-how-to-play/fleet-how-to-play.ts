import { Component, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Preferences } from '@preferences';
import { Button, Ticket } from '@ui';

/**
 * How to play Ship Sink: the shared departure ticket with four rules, each beside a small drawing
 * of the board's own marks. Shown on the first visit; Settings reopens it.
 */
@Component({
  selector: 'app-fleet-how-to-play',
  imports: [Button, Ticket],
  templateUrl: './fleet-how-to-play.html',
  styleUrl: './fleet-how-to-play.css',
})
export class FleetHowToPlay {
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);
  private readonly ticket = viewChild.required(Ticket);

  open(): void {
    this.ticket().open();
  }

  protected dismiss(): void {
    this.ticket().close();
  }

  protected onClose(): void {
    this.preferences.markTutorialSeen('fleet');
  }
}
