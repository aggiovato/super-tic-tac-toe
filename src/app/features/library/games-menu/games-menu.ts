import {
  afterNextRender,
  Component,
  DestroyRef,
  type ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Translator } from '@i18n';
import { Button, Icon, trackTear } from '@ui';
import { GameLibrary } from '../game-library/game-library';

/**
 * The way to the other games where the page has no room for the library aside: a masthead button
 * on tablets and narrow windows, opening a sheet from the right; on phones a floating button at the
 * bottom left (the chat's twin), whose ticket grows out of it and goes back into it.
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
  private readonly head = viewChild.required<ElementRef<HTMLElement>>('head');
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() =>
      destroyRef.onDestroy(trackTear(this.head().nativeElement, this.card().nativeElement)),
    );
  }

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
