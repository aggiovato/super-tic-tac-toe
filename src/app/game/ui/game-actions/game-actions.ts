import { Component, computed, inject } from '@angular/core';
import { Translator } from '@i18n';
import { Button, Icon } from '@kit';
import { GameStore } from '@state';

/** Undo the last move while the game runs; a rematch once it is over. */
@Component({
  selector: 'app-game-actions',
  imports: [Button, Icon],
  templateUrl: './game-actions.html',
  styleUrl: './game-actions.css',
})
export class GameActions {
  protected readonly store = inject(GameStore);
  protected readonly t = inject(Translator).t;

  protected readonly canUndo = computed(
    () => this.store.game().moves.length > 0 && !this.store.isOver(),
  );
}
