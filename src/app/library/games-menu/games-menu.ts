import { Component, type ElementRef, inject, viewChild } from '@angular/core';
import { Translator } from '@i18n';
import { Button, Icon } from '@kit';
import { GameLibrary } from '../game-library/game-library';

/**
 * The masthead's way to the other games where the page has no room for the library aside (phones
 * and narrow windows): a button that opens the library in a modal dialog, a bottom sheet on phones.
 * Hidden where the aside shows. The native dialog traps focus and closes on Escape; a click on the
 * backdrop or on a game closes it too.
 */
@Component({
  selector: 'app-games-menu',
  imports: [Button, Icon, GameLibrary],
  templateUrl: './games-menu.html',
  styleUrl: './games-menu.css',
})
export class GamesMenu {
  protected readonly t = inject(Translator).t;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** A click that lands on the dialog itself fell on its backdrop. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
