import { Component, inject, input } from '@angular/core';
import { Translator } from '@i18n';
import { Backdrop, Button, Icon } from '@ui';
import { Preferences } from '@preferences';
import { GameLibrary } from '@library';
import { UpdateNotice } from '@pwa';
import { OnlinePanel } from '@online';

/**
 * The page every game shares: the masthead (title and settings), the status row, the board in the
 * arena, the controls and, on wide screens, the library of games in an aside on the left, which
 * folds to a rail (remembered with the preferences). Content goes to its slot by attribute: `masthead`, `status`, `arena`,
 * `controls`.
 */
@Component({
  selector: 'app-game-layout',
  imports: [Backdrop, Button, Icon, GameLibrary, OnlinePanel, UpdateNotice],
  templateUrl: './game-layout.html',
  styleUrl: './game-layout.css',
})
export class GameLayout {
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);
  protected readonly shown = this.preferences.libraryShown;

  protected toggle(): void {
    this.preferences.setLibraryShown(!this.shown());
  }

  /** The arena's accessible name. */
  readonly arenaLabel = input.required<string>();
}
