import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Button } from '@kit';
import { Preferences } from '@settings';

/**
 * How to play: a departure ticket with the three rules, each beside a tiny board drawing, over the
 * real board. A native modal dialog, so the page behind is inert, Escape closes it and focus
 * returns where it was. Closing it in any way (Play, Skip, Escape) records it as seen; the page
 * opens it on the first visit and the settings reopen it.
 */
@Component({
  selector: 'app-how-to-play',
  imports: [Button],
  templateUrl: './how-to-play.html',
  styleUrl: './how-to-play.css',
})
export class HowToPlay {
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('ticket');

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  protected dismiss(): void {
    this.dialog().nativeElement.close();
  }

  protected onClose(): void {
    this.preferences.markTutorialSeen();
  }
}
