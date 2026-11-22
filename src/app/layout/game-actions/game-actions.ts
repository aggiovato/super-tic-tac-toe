import { Component, inject } from '@angular/core';
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
})
export class GameActions {
  protected readonly store = inject(ACTIVE_GAME).match;
  protected readonly t = inject(Translator).t;
}
