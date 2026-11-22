import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Translator } from '@i18n';
import { Button, Icon } from '@kit';
import { ACTIVE_GAME } from '../active-game';

/** The masthead's way to the game's history. */
@Component({
  selector: 'app-history-link',
  imports: [Button, Icon],
  template: `
    <button app-button="quiet" size="small" (click)="open()">
      <app-icon name="history" />
      <!-- Small phones: the icon only, so the brand's flaps have room; the name stays for readers. -->
      <span class="max-[30rem]:sr-only">{{ t().history.open }}</span>
    </button>
  `,
})
export class HistoryLink {
  protected readonly t = inject(Translator).t;
  private readonly game = inject(ACTIVE_GAME);
  private readonly router = inject(Router);

  protected open(): void {
    void this.router.navigate(['/', this.game.id, 'history']);
  }
}
