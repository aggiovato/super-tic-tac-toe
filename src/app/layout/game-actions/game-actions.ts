import { Component, computed, inject } from '@angular/core';
import { gameById } from '@catalog';
import { Translator } from '@i18n';
import { Button, Icon } from '@ui';
import { ACTIVE_GAME } from '@match';

/**
 * Undo while the game runs (against the computer, back to the player's turn; never online); a
 * rematch once it is over.
 */
@Component({
  selector: 'app-game-actions',
  imports: [Button, Icon],
  templateUrl: './game-actions.html',
  styleUrl: './game-actions.css',
  // Without undo (online, or a game of hidden information) there is nothing here until the
  // rematch, so no row either.
  host: { '[hidden]': '!undoable() && !store.isOver()' },
})
export class GameActions {
  private readonly game = inject(ACTIVE_GAME);
  protected readonly store = this.game.match;
  /** Whether this game offers undo at all: not online, and not over hidden information. */
  protected readonly undoable = computed(
    () => this.store.mode() !== 'online' && !gameById(this.game.id).rules.hidden,
  );
  protected readonly t = inject(Translator).t;
}
