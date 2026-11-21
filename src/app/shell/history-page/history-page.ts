import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Translator } from '@i18n';
import { Backdrop, Button, Icon } from '@kit';
import { type GameId, OPPONENT_LEVELS, type OpponentLevel, Preferences } from '@settings';
import { type GameRecord, GameRepository } from '@storage';
import { BrandTitle } from '../brand-title/brand-title';
import { participantName } from '../participant-name';

interface LevelRow {
  readonly level: OpponentLevel;
  readonly label: string;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
}

interface RecentGame {
  readonly id: string;
  readonly when: string;
  readonly setup: string;
  readonly result: string;
  readonly moves: string;
}

/** How many finished games the list shows. */
const RECENT = 10;

/**
 * A game's history (`/<game>/history`): results against the computer by level, how many games two
 * people finished, and the latest finished games. Read from the device's saved games.
 */
@Component({
  selector: 'app-history-page',
  imports: [Backdrop, BrandTitle, Button, Icon],
  templateUrl: './history-page.html',
  styleUrl: './history-page.css',
})
export class HistoryPage {
  private readonly translator = inject(Translator);
  protected readonly t = this.translator.t;
  private readonly preferences = inject(Preferences);
  private readonly router = inject(Router);
  protected readonly gameId = inject(ActivatedRoute).snapshot.data['gameId'] as GameId;

  /** Finished games, newest first; null while they load. */
  private readonly games = signal<readonly GameRecord[] | null>(null);
  protected readonly loaded = computed(() => this.games() !== null);

  protected readonly levels = computed((): readonly LevelRow[] => {
    const games = (this.games() ?? []).filter((game) => game.mode === 'opponent');
    return OPPONENT_LEVELS.map((level) => {
      const at = games.filter((game) => game.level === level);
      return {
        level,
        label: this.t().settings.levels[level],
        wins: at.filter((game) => game.result === 'won-0').length,
        draws: at.filter((game) => game.result === 'draw').length,
        losses: at.filter((game) => game.result === 'won-1').length,
      };
    });
  });

  protected readonly humans = computed(
    () => (this.games() ?? []).filter((game) => game.mode === 'humans').length,
  );

  protected readonly recent = computed((): readonly RecentGame[] => {
    const t = this.t();
    const date = new Intl.DateTimeFormat(this.translator.lang(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return (this.games() ?? []).slice(0, RECENT).map((game) => ({
      id: game.id,
      when: date.format(game.finishedAt ?? game.updatedAt),
      setup:
        game.mode === 'opponent'
          ? `${t.settings.modes.opponent} · ${t.settings.levels[game.level]}`
          : t.settings.modes.humans,
      result: this.resultOf(game),
      moves: t.history.moves(game.revision),
    }));
  });

  constructor() {
    void inject(GameRepository)
      .finished(this.gameId)
      .then(
        (games) => this.games.set(games),
        () => this.games.set([]),
      );
  }

  private resultOf(game: GameRecord): string {
    const h = this.t().history;
    if (game.result === 'draw') {
      return h.draw;
    }
    const winner = game.result === 'won-0' ? 0 : 1;
    if (game.mode === 'opponent') {
      return winner === 0 ? h.won : h.lost;
    }
    const name =
      participantName(this.t(), this.preferences.names(), game.mode, winner) ??
      this.t().defaultName(winner + 1);
    return h.winner(name);
  }

  protected back(): void {
    void this.router.navigate(['/', this.gameId]);
  }
}
