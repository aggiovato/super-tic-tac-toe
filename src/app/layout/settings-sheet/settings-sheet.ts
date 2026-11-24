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
import { type Lang, MESSAGES, Translator } from '@i18n';
import {
  Button,
  ChoiceGroup,
  type ChoiceOption,
  Icon,
  injectMediaQuery,
  swipeToClose,
  trackTear,
} from '@ui';
import { type ComputerLevel, COMPUTER_LEVELS, gameById } from '@catalog';
import {
  type Design,
  DESIGNS,
  type MotionSetting,
  NAME_MAX_LENGTH,
  type PlayMode,
  type PlaySetup,
  Preferences,
} from '@preferences';
import { ACTIVE_GAME } from '@match';
import { OnlineStart } from '@online';
import { CONFIRM_WINDOW_MS, TwoPress } from '../two-press';

const MOTIONS: readonly MotionSetting[] = ['system', 'full', 'reduced'];
const SECTIONS = ['game', 'players', 'app'] as const;
type Section = (typeof SECTIONS)[number];
/** Who this device plays against: a play mode, or a room online (created from its invitation). */
type Who = PlayMode | 'online';
const WHO: readonly Who[] = ['computer', 'local', 'online'];

/**
 * Settings in three tabs. Game: the game's own settings (projected content) and a new series.
 * Players: who plays (the computer and its level, two people here, or an online room) and the
 * names. App: language, motion and design. Inside an online room the game is the room's, so only
 * Players (the names) and App are offered.
 */
@Component({
  selector: 'app-settings-sheet',
  imports: [Button, ChoiceGroup, Icon, OnlineStart],
  templateUrl: './settings-sheet.html',
  styleUrl: './settings-sheet.css',
})
export class SettingsSheet {
  protected readonly translator = inject(Translator);
  protected readonly t = this.translator.t;
  protected readonly preferences = inject(Preferences);
  protected readonly game = inject(ACTIVE_GAME);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly nameMaxLength = NAME_MAX_LENGTH;

  /** The tab last chosen. */
  protected readonly section = signal<Section>('game');

  /** The tabs offered: the game's own is the room's while playing online. */
  private readonly sections = computed((): readonly Section[] =>
    this.online() ? SECTIONS.filter((id) => id !== 'game') : SECTIONS,
  );

  /** The open tab: the one chosen, or the first offered when it is not. */
  protected readonly shownSection = computed((): Section => {
    const sections = this.sections();
    return sections.includes(this.section()) ? this.section() : (sections[0] ?? 'app');
  });

  protected readonly tabs = computed(() =>
    this.sections().map((id) => ({ id, label: this.t().settings.sectionNames[id] })),
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

  protected readonly whoOptions = computed((): readonly ChoiceOption<Who>[] => {
    const s = this.t().settings;
    // A game of hidden information is not offered to two people on one device.
    const { modes, online } = gameById(this.game.id);
    return WHO.filter((who) => (who === 'online' ? online : modes.includes(who))).map((who) => ({
      value: who,
      label: who === 'online' ? s.onlineMode : s.modes[who],
    }));
  });

  protected readonly levelOptions = computed((): readonly ChoiceOption<ComputerLevel>[] =>
    COMPUTER_LEVELS.map((level, i) => ({
      value: level,
      label: this.t().opponents[level],
      bars: i + 1,
    })),
  );

  protected readonly designOptions = computed((): readonly ChoiceOption<Design>[] =>
    DESIGNS.map((design) => ({ value: design, label: this.t().settings.designs[design] })),
  );

  /** This game's saved setup: who plays it. */
  private readonly setup = computed(() => this.preferences.play()[this.game.id]);

  /** An online game: who plays is the room's, so the setup is not offered. */
  protected readonly online = computed(() => this.game.match.mode() === 'online');

  /** Name fields: against the computer or online only this device's player has one. */
  protected readonly nameFields = computed((): readonly (0 | 1)[] =>
    this.online() || this.shownWho() !== 'local' ? [0] : [0, 1],
  );

  /** "New series" asks once more before clearing the score. */
  protected readonly reset = new TwoPress();

  /**
   * A mode or level picked while a score or a game is under way waits for a second press, like
   * "New series"; the choice shown falls back when the question expires.
   */
  protected readonly pendingSetup = signal<PlaySetup | null>(null);
  private pendingTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly shownMode = computed(() => (this.pendingSetup() ?? this.setup()).mode);
  protected readonly shownLevel = computed(() => (this.pendingSetup() ?? this.setup()).level);

  /** "Online room" chosen: its invitation shows; the mode changes only once a room opens. */
  private readonly inviting = signal(false);
  protected readonly shownWho = computed((): Who =>
    this.inviting() ? 'online' : this.shownMode(),
  );

  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');
  private readonly handle = viewChild.required<ElementRef<HTMLElement>>('handle');
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
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
      destroyRef.onDestroy(trackTear(this.handle().nativeElement, this.card().nativeElement));
    });
  }

  /** Hides the sheet, e.g. before a game's own modal or another route takes over. */
  close(): void {
    this.sheet().nativeElement.hidePopover();
  }

  protected setWho(who: Who): void {
    if (who === 'online') {
      this.clearPending();
      this.inviting.set(true);
      return;
    }
    this.inviting.set(false);
    this.requestSetup({ mode: who, level: this.shownLevel() });
  }

  protected setLevel(level: ComputerLevel): void {
    this.requestSetup({ mode: 'computer', level });
  }

  protected confirmPending(): void {
    const setup = this.pendingSetup();
    this.clearPending();
    if (setup) {
      this.applySetup(setup);
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

  private clearPending(): void {
    clearTimeout(this.pendingTimer);
    this.pendingSetup.set(null);
  }

  protected onName(index: 0 | 1, event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.preferences.setName(index, event.target.value);
    }
  }

  /** Arrow keys, Home and End move between the tabs, which follow focus (ARIA tabs pattern). */
  protected onTabKey(event: KeyboardEvent): void {
    const sections = this.sections();
    const current = sections.indexOf(this.shownSection());
    const last = sections.length - 1;
    const next: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const index = next[event.key];
    const section = index === undefined ? undefined : sections[index];
    if (section === undefined) {
      return;
    }
    event.preventDefault();
    this.section.set(section);
    this.host.nativeElement.querySelector<HTMLElement>(`#settings-tab-${section}`)?.focus();
  }

  protected newSeries(): void {
    if (this.reset.press()) {
      this.game.match.newSeries();
    }
  }
}
