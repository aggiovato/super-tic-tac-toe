import { Component, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translator } from '@i18n';
import { Button, Ticket } from '@ui';
import { Preferences } from '@preferences';
import { Super3tStore } from '@super3t/state';

/**
 * How to play: a departure ticket with the four rules, each beside a tiny board drawing, over the
 * real board. A native modal dialog, so the page behind is inert, Escape closes it and focus
 * returns where it was. Closing it in any way (Play, Skip, Escape) records it as seen; the page
 * opens it on the first visit and the settings reopen it. While no game is under way it also links
 * to the tactical challenges.
 */
@Component({
  selector: 'app-how-to-play',
  imports: [Button, RouterLink, Ticket],
  templateUrl: './how-to-play.html',
  styleUrl: './how-to-play.css',
})
export class HowToPlay {
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);
  protected readonly store = inject(Super3tStore);
  private readonly ticket = viewChild.required(Ticket);

  open(): void {
    this.ticket().open();
  }

  protected dismiss(): void {
    this.ticket().close();
  }

  protected onClose(): void {
    this.preferences.markTutorialSeen('super-3t');
  }
}
