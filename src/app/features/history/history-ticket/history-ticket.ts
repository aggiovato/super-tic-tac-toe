import {
  afterNextRender,
  Component,
  computed,
  type ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Translator } from '@i18n';
import { Button, DepartureBoard, type FlapTile, Icon, injectMediaQuery, LevelBars } from '@ui';
import { COMPUTER_LEVELS, gameById, type GameId } from '@catalog';
import { Preferences } from '@preferences';
import { type GameRecord, GameRepository } from '@storage';
import { participantName } from '@layout';
import { FormChart } from '../form-chart/form-chart';
import { LengthChart } from '../length-chart/length-chart';
import { CHART_MIN_GAMES, historyStats } from './history-stats';
import type { HistoryEntry, LevelStats, VariantStats } from './history.model';
import type {
  HistoryPart,
  HistoryState,
  LevelRowView,
  RecentView,
  SectionView,
  TotalView,
} from './history-view.model';
import { TicketTear } from './ticket-tear';

/** Two flap digits, capped at 99. */
const digits = (value: number): string[] => [...String(Math.min(value, 99)).padStart(2, '0')];
/** The totals cascade further than an ordinary flap when the ticket opens. */
const TOTAL_STEPS = 10;

/**
 * A game's history (`/<game>/history`), as a departure ticket over the game: its stub carries the
 * totals against the computer on split-flaps; the body, the results by level with their form, and
 * the latest games with their lengths. Two tickets side by side on wide screens, one with two tabs
 * on phones. Closing it (×, Escape, the backdrop or Back) returns to the game, which never left.
 */
@Component({
  selector: 'app-history-ticket',
  imports: [
    Button,
    DepartureBoard,
    FormChart,
    Icon,
    LengthChart,
    LevelBars,
    NgTemplateOutlet,
    TicketTear,
  ],
  templateUrl: './history-ticket.html',
  styleUrl: './history-ticket.css',
})
export class HistoryTicket {
  private readonly translator = inject(Translator);
  protected readonly t = this.translator.t;
  private readonly preferences = inject(Preferences);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly gameId = this.route.snapshot.data['gameId'] as GameId;
  private readonly game = gameById(this.gameId);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly location = inject(Location);
  /** Opened from its game in this tab (not a link or a reload): the game is one entry back. */
  private readonly openedFromGame = this.cameFromGame();

  /** Two tickets side by side where there is room for both. */
  protected readonly pair = injectMediaQuery('(min-width: 60rem)');
  protected readonly part = signal<HistoryPart>('results');
  protected readonly parts: readonly HistoryPart[] = ['results', 'recent'];

  /** Finished games, newest first; null while they load. */
  private readonly games = signal<readonly GameRecord[] | null>(null);
  private readonly failed = signal(false);
  /** Set once the ticket is drawn, so the totals cascade from blank instead of appearing. */
  private readonly drawn = signal(false);

  private readonly stats = computed(() => historyStats(this.games() ?? [], this.game));

  protected readonly state = computed((): HistoryState => {
    if (this.failed()) {
      return 'error';
    }
    if (this.games() === null) {
      return 'loading';
    }
    return this.stats().finished === 0 ? 'empty' : 'ready';
  });

  protected readonly charts = computed(() => this.stats().finished >= CHART_MIN_GAMES);
  protected readonly multiSize = this.game.variants.length > 1;

  protected readonly totals = computed((): TotalView[] => {
    const h = this.t().history;
    const shown = this.drawn() && this.state() === 'ready';
    const { wins, draws, losses } = this.stats().totals;
    const total = (key: TotalView['key'], caption: string, value: number): TotalView => ({
      key,
      caption,
      tiles: (shown ? digits(value) : [' ', ' ']).map((char) => ({
        char,
        accent: false,
        steps: TOTAL_STEPS,
      })),
    });
    return [
      total('wins', h.wins, wins),
      total('draws', h.draws, draws),
      total('losses', h.losses, losses),
    ];
  });

  protected readonly totalsLabel = computed(() => {
    const { wins, draws, losses } = this.stats().totals;
    return this.t().history.totals(wins, draws, losses);
  });

  protected readonly sections = computed((): SectionView[] =>
    this.stats().variants.map((section) => this.sectionView(section)),
  );

  /** The latest results on flaps: a letter against the computer, the winner's mark between people. */
  protected readonly strip = computed((): FlapTile[] => {
    const letter = this.t().history.flapResult;
    return this.stats()
      .recent.map((game): FlapTile => {
        if (game.outcome === 'people') {
          return { char: game.winnerMark ?? letter.drawn, accent: false };
        }
        return { char: letter[game.outcome], accent: game.outcome === 'won' };
      })
      .reverse();
  });

  protected readonly stripLabel = computed(() => this.t().history.strip(this.strip().length));

  protected readonly recent = computed((): RecentView[] => {
    const t = this.t();
    const date = new Intl.DateTimeFormat(this.translator.lang(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const records = new Map((this.games() ?? []).map((record) => [record.id, record]));
    return this.stats().recent.map((game) => ({
      id: game.id,
      result: this.resultOf(game, records.get(game.id)),
      setup:
        (this.multiSize ? `${t.history.board(game.variant)} · ` : '') +
        this.setupOf(records.get(game.id)),
      when: date.format(game.finishedAt),
      moves: t.history.moves(game.moves),
    }));
  });

  protected readonly lengths = computed(() => this.stats().lengths);

  protected readonly lengthLabel = computed(() => {
    const moves = this.lengths().map((game) => game.moves);
    return this.t().history.lengthLabel(moves.length, Math.min(...moves), Math.max(...moves));
  });

  constructor() {
    void inject(GameRepository)
      .finished(this.gameId)
      .then(
        (games) => this.games.set(games),
        () => this.failed.set(true),
      );
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('#history-title')?.focus();
      this.drawn.set(true);
    });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /**
   * However the dialog closed, the game is where it goes back to, once the tickets have finished
   * leaving (the route change would cut their exit short): a step back when the game opened it (so
   * closing leaves no extra entry behind), the game's route in its place after a link.
   */
  protected leave(): void {
    void this.exited().then(() => this.backToGame());
  }

  /** Settles when the closing transitions have run; at once without motion. */
  private exited(): Promise<void> {
    // Reading the animations flushes styles, so the exit transitions have started by now.
    const running = this.dialog().nativeElement.getAnimations({ subtree: true });
    return Promise.allSettled(running.map((animation) => animation.finished)).then(() => undefined);
  }

  private backToGame(): void {
    if (this.openedFromGame) {
      this.location.back();
      return;
    }
    void this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true });
  }

  private cameFromGame(): boolean {
    const navigation = this.router.currentNavigation();
    const from = navigation?.previousNavigation?.finalUrl;
    const to = navigation?.finalUrl;
    if (!from || !to) {
      return false;
    }
    const parent = this.router.serializeUrl(to).replace(/\/history$/, '');
    return this.router.serializeUrl(from) === parent;
  }

  /** A click that lands on the dialog itself fell on its backdrop. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  /** Arrow keys move between the two tabs, as in Settings. */
  protected onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    const next: HistoryPart = this.part() === 'results' ? 'recent' : 'results';
    this.part.set(next);
    const tabs = (event.currentTarget as HTMLElement).parentElement;
    tabs?.querySelector<HTMLElement>(`#history-tab-${next}`)?.focus();
  }

  private sectionView(section: VariantStats): SectionView {
    const t = this.t();
    const h = t.history;
    const name = (level: LevelStats['level']) => t.opponents[level];
    const bars = (level: LevelStats['level']) => COMPUTER_LEVELS.indexOf(level) + 1;
    return {
      variant: section.variant,
      label: this.multiSize ? h.board(section.variant) : null,
      people: h.humans(section.people),
      rows: section.levels.map((row): LevelRowView => {
        const played = Math.max(1, row.wins + row.draws + row.losses);
        const share = (value: number) => (value / played) * 100;
        return {
          level: row.level,
          name: name(row.level),
          bars: bars(row.level),
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          share: [share(row.wins), share(row.draws), share(row.losses)],
        };
      }),
      form: section.levels.map((row) => {
        const count = (outcome: string) => row.form.filter((o) => o === outcome).length;
        return {
          level: row.level,
          name: name(row.level),
          bars: bars(row.level),
          form: row.form,
          label: h.formRow(name(row.level), count('won'), count('drawn'), count('lost')),
        };
      }),
    };
  }

  private setupOf(record: GameRecord | undefined): string {
    const t = this.t();
    const other = record?.seats[1];
    return other?.kind === 'computer'
      ? t.opponents[other.level ?? 'beginner']
      : t.settings.modes.local;
  }

  private resultOf(game: HistoryEntry, record: GameRecord | undefined): string {
    const t = this.t();
    const h = t.history;
    if (game.winner === null) {
      return h.draw;
    }
    if (game.outcome !== 'people') {
      return game.outcome === 'won' ? h.won : h.lost;
    }
    // The name the winner had when the game was played; older records fall back to today's.
    const side = { mode: 'local' as const, level: 'beginner' as const };
    const name =
      record?.seats[game.winner].name ??
      participantName(t, this.preferences.names(), side, game.winner) ??
      t.defaultName(game.winner + 1);
    return h.winner(name);
  }
}
