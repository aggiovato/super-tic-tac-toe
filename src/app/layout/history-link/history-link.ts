import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Translator } from '@i18n';
import { Button, Icon } from '@ui';

/** The masthead's way to the game's history, opened over the game. */
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
  private readonly router = inject(Router);
  /** The game's route: the history opens as its child, over the game (or the online room). */
  private readonly route = inject(ActivatedRoute);

  protected open(): void {
    void this.router.navigate(['history'], { relativeTo: this.route });
  }
}
