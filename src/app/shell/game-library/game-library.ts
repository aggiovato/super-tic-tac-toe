import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translator } from '@i18n';
import { GAME_IDS, type GameId } from '@settings';
import { ACTIVE_GAME } from '../active-game';
import { GamePreview } from './game-preview';

/** The main game, shown as the banner above the others. */
const FEATURED: GameId = 'super-3t';

/**
 * The family of games: a banner for Super 3T, the main game, then a card for each other game, each
 * with a drawn preview. The game on screen is marked as playing (`aria-current`). Every game is
 * saved, so going to another loses nothing. Shown in the page's aside on wide screens and in the
 * games dialog on narrower ones.
 */
@Component({
  selector: 'app-game-library',
  imports: [RouterLink, GamePreview],
  templateUrl: './game-library.html',
  styleUrl: './game-library.css',
})
export class GameLibrary {
  protected readonly t = inject(Translator).t;
  /** The game on screen; none outside a game's route. */
  protected readonly current = inject(ACTIVE_GAME, { optional: true })?.id ?? null;

  /** A game was chosen (the dialog closes on it). */
  readonly chosen = output<GameId>();

  protected readonly cards = computed(() =>
    GAME_IDS.map((id) => ({
      id,
      name: this.t().games[id],
      blurb: this.t().library.blurbs[id],
      playing: id === this.current,
    })),
  );
  protected readonly banner = computed(() => this.cards().find((card) => card.id === FEATURED)!);
  protected readonly rest = computed(() => this.cards().filter((card) => card.id !== FEATURED));
}
