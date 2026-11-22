import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translator } from '@i18n';
import { GAMES, type GameId } from '@catalog';
import { ACTIVE_GAME } from '../active-game';
import { GAME_PREVIEWS } from './game-previews';

/**
 * The family of games from the catalog: a banner for the featured one (Super 3T, the main game), then
 * a card for each other game, each with its own drawn preview (`GAME_PREVIEWS`). The game on screen is marked as playing (`aria-current`). Every game is
 * saved, so going to another loses nothing. Shown in the page's aside on wide screens and in the
 * games dialog on narrower ones.
 */
@Component({
  selector: 'app-game-library',
  imports: [RouterLink, NgComponentOutlet],
  templateUrl: './game-library.html',
  styleUrl: './game-library.css',
})
export class GameLibrary {
  protected readonly t = inject(Translator).t;
  /** The game on screen; none outside a game's route. */
  protected readonly current = inject(ACTIVE_GAME, { optional: true })?.id ?? null;

  /** A game was chosen (the dialog closes on it). */
  readonly chosen = output<GameId>();

  private readonly previews = inject(GAME_PREVIEWS);
  /** A preview framed tight on its board, for the smaller cards. */
  protected readonly square = { square: true };

  protected readonly cards = computed(() =>
    GAMES.map(({ id, featured }) => ({
      id,
      featured,
      name: this.t().games[id],
      blurb: this.t().library.blurbs[id],
      preview: this.previews[id],
      playing: id === this.current,
    })),
  );
  protected readonly banner = computed(() => this.cards().find((card) => card.featured)!);
  protected readonly rest = computed(() => this.cards().filter((card) => !card.featured));
}
