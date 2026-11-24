import { Component, computed, inject } from '@angular/core';
import { gameById } from '@catalog';
import { Translator } from '@i18n';
import { Button, Icon } from '@ui';
import { ACTIVE_GAME } from '@match';

/**
 * Undo while the game runs (against the computer at its first level, back to the player's turn);
 * a rematch once it is over.
 */
@Component({
  selector: 'app-game-actions',
  imports: [Button, Icon],
  templateUrl: './game-actions.html',
  styleUrl: './game-actions.css',
  // Without undo there is nothing here until the rematch, so no row either.
  host: { '[hidden]': '!undoable() && !store.isOver()' },
})
export class GameActions {
  private readonly game = inject(ACTIVE_GAME);
  protected readonly store = this.game.match;
  /**
   * Whether undo is offered: only against the computer at its first level, where it helps someone
   * learning the game; never between two people, online, at the stronger levels, or over hidden
   * information (it would peek).
   */
  protected readonly undoable = computed(
    () =>
      this.store.mode() === 'computer' &&
      this.store.level() === 'beginner' &&
      !gameById(this.game.id).rules.hidden,
  );
  protected readonly t = inject(Translator).t;
}
