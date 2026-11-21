import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { type Lang, MESSAGES, Translator } from '@i18n';
import { Button, ChoiceGroup, type ChoiceOption, Icon, injectMediaQuery, swipeToClose } from '@kit';
import {
  type Design,
  DESIGNS,
  GAME_IDS,
  type GameId,
  type MotionSetting,
  NAME_MAX_LENGTH,
  type OpponentLevel,
  OPPONENT_LEVELS,
  PLAY_MODES,
  type PlayMode,
  type PlaySetup,
  Preferences,
} from '@settings';
import { ACTIVE_GAME } from '../active-game';
import { CONFIRM_WINDOW_MS, TwoPress } from '../two-press';

const MOTIONS: readonly MotionSetting[] = ['system', 'full', 'reduced'];
const SECTIONS = ['game', 'app'] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Settings in two tabs. Game: which game, the game's own settings (projected content), who plays
 * (mode and level), names and a new series. App: language, motion and design.
 */
@Component({
  selector: 'app-settings-sheet',
  imports: [Button, ChoiceGroup, Icon],
  templateUrl: './settings-sheet.html',
  styleUrl: './settings-sheet.css',
})
export class SettingsSheet {
  protected readonly translator = inject(Translator);
  protected readonly t = this.translator.t;
  protected readonly preferences = inject(Preferences);
  protected readonly game = inject(ACTIVE_GAME);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  protected readonly nameMaxLength = NAME_MAX_LENGTH;

  /** The open tab: this game's settings, or the app's. */
  protected readonly section = signal<Section>('game');

  protected readonly tabs = computed(() =>
    SECTIONS.map((id) => ({ id, label: this.t().settings.sectionNames[id] })),
  );

  protected readonly gameOptions = computed((): readonly ChoiceOption<GameId>[] =>
    GAME_IDS.map((id) => ({ value: id, label: this.t().games[id] })),
  );

  /** Each language is offered in its own name and language. */
  protected readonly languageOptions = computed((): readonly ChoiceOption<Lang>[] =>
    this.translator.languages.map((lang) => ({
      value: lang,
      label: MESSAGES[lang].langName,
      lang,
    })),
  );

  protected readonly motionOptions = computed((): readonly ChoiceOption<MotionSetting>[] => {
    const s = this.t().settings;
    const labels: Record<MotionSetting, string> = {
      system: s.motionSystem,
      full: s.motionFull,
      reduced: s.motionReduced,
    };
    return MOTIONS.map((motion) => ({ value: motion, label: labels[motion] }));
  });

  protected readonly modeOptions = computed((): readonly ChoiceOption<PlayMode>[] =>
    PLAY_MODES.map((mode) => ({ value: mode, label: this.t().settings.modes[mode] })),
  );

  protected readonly levelOptions = computed((): readonly ChoiceOption<OpponentLevel>[] =>
    OPPONENT_LEVELS.map((level) => ({ value: level, label: this.t().settings.levels[level] })),
  );

  protected readonly designOptions = computed((): readonly ChoiceOption<Design>[] =>
    DESIGNS.map((design) => ({ value: design, label: this.t().settings.designs[design] })),
  );

  /** This game's saved setup: who plays it. */
  private readonly setup = computed(() => this.preferences.play()[this.game.id]);

  /** Name fields: against the computer only the person has one. */
  protected readonly nameFields = computed((): readonly (0 | 1)[] =>
    this.setup().mode === 'opponent' ? [0] : [0, 1],
  );

  /** "New series" asks once more before clearing the score. */
  protected readonly reset = new TwoPress();

  /**
   * A mode, level or game picked while a score or a game is under way waits for a second press,
   * like "New series"; the choice shown falls back when the question expires.
   */
  protected readonly pendingSetup = signal<PlaySetup | null>(null);
  protected readonly pendingGame = signal<GameId | null>(null);
  private pendingTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly shownMode = computed(() => (this.pendingSetup() ?? this.setup()).mode);
  protected readonly shownLevel = computed(() => (this.pendingSetup() ?? this.setup()).level);
  protected readonly shownGame = computed(() => this.pendingGame() ?? this.game.id);

  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');
  private readonly handle = viewChild.required<ElementRef<HTMLElement>>('handle');
  /** Phones get a bottom sheet, which can be dragged down to close. */
  private readonly narrow = injectMediaQuery('(max-width: 34.99rem)');

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.reset.reset();
      clearTimeout(this.pendingTimer);
    });
    afterNextRender(() => {
      const sheet = this.sheet().nativeElement;
      const stop = swipeToClose(
        this.handle().nativeElement,
        sheet,
        () => this.close(),
        this.narrow,
      );
      destroyRef.onDestroy(stop);
    });
  }

  /** Hides the sheet, e.g. before a game's own modal or another route takes over. */
  close(): void {
    this.sheet().nativeElement.hidePopover();
  }

  protected setMode(mode: PlayMode): void {
    this.requestSetup({ mode, level: this.shownLevel() });
  }

  protected setLevel(level: OpponentLevel): void {
    this.requestSetup({ mode: 'opponent', level });
  }

  /** Another game: at once when nothing is lost, else after a second press. */
  protected switchGame(id: GameId): void {
    this.clearPending();
    if (id === this.game.id) {
      return;
    }
    if (!this.game.match.seriesStarted()) {
      this.goTo(id);
      return;
    }
    this.pendingGame.set(id);
    this.pendingTimer = setTimeout(() => this.clearPending(), CONFIRM_WINDOW_MS);
  }

  protected confirmPending(): void {
    const setup = this.pendingSetup();
    const game = this.pendingGame();
    this.clearPending();
    if (setup) {
      this.applySetup(setup);
    } else if (game) {
      this.goTo(game);
    }
  }

  /** Changing who plays starts a new series: at once when nothing is lost, else after confirming. */
  private requestSetup(setup: PlaySetup): void {
    this.clearPending();
    const current = this.setup();
    if (setup.mode === current.mode && setup.level === current.level) {
      return;
    }
    if (!this.game.match.seriesStarted()) {
      this.applySetup(setup);
      return;
    }
    this.pendingSetup.set(setup);
    this.pendingTimer = setTimeout(() => this.clearPending(), CONFIRM_WINDOW_MS);
  }

  private applySetup(setup: PlaySetup): void {
    this.preferences.setPlay(this.game.id, setup);
    this.game.match.setMode(setup.mode, setup.level);
  }

  private goTo(id: GameId): void {
    this.close();
    void this.router.navigate(['/', id]);
  }

  private clearPending(): void {
    clearTimeout(this.pendingTimer);
    this.pendingSetup.set(null);
    this.pendingGame.set(null);
  }

  protected onName(index: 0 | 1, event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.preferences.setName(index, event.target.value);
    }
  }

  /** Arrow keys, Home and End move between the tabs, which follow focus (ARIA tabs pattern). */
  protected onTabKey(event: KeyboardEvent): void {
    const current = SECTIONS.indexOf(this.section());
    const last = SECTIONS.length - 1;
    const next: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const index = next[event.key];
    if (index === undefined) {
      return;
    }
    event.preventDefault();
    this.section.set(SECTIONS[index]);
    this.host.nativeElement.querySelector<HTMLElement>(`#settings-tab-${SECTIONS[index]}`)?.focus();
  }

  protected newSeries(): void {
    if (this.reset.press()) {
      this.game.match.newSeries();
    }
  }
}
