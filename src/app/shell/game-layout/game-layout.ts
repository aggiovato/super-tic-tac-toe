import { Component, input } from '@angular/core';
import { Backdrop } from '@kit';

/**
 * The page every game shares: the masthead (title and settings), the status row, the board in the
 * arena and the controls. Content goes to its slot by attribute: `masthead`, `status`, `arena`,
 * `controls`.
 */
@Component({
  selector: 'app-game-layout',
  imports: [Backdrop],
  templateUrl: './game-layout.html',
  styleUrl: './game-layout.css',
})
export class GameLayout {
  /** The arena's accessible name. */
  readonly arenaLabel = input.required<string>();
}
