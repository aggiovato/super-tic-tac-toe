import { Component, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Button, Ticket } from '@kit';
import { Preferences } from '@preferences';

/**
 * How to play Dots and Boxes: the shared departure ticket with four rules, each beside a small
 * drawing in the players' inks. Shown on the first visit; Settings reopens it.
 */
@Component({
  selector: 'app-dots-how-to-play',
  imports: [Button, Ticket],
  templateUrl: './dots-how-to-play.html',
  styleUrl: './dots-how-to-play.css',
})
export class DotsHowToPlay {
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
    this.preferences.markTutorialSeen('dots');
  }
}
