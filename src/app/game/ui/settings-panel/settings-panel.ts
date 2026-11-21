import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { type Lang, MESSAGES, Translator } from '@i18n';
import {
  Button,
  Choice,
  ChoiceGroup,
  type ChoiceOption,
  Icon,
  injectMediaQuery,
  swipeToClose,
} from '@kit';
import {
  type Design,
  DESIGNS,
  type MotionSetting,
  NAME_MAX_LENGTH,
  type OpponentLevel,
  OPPONENT_LEVELS,
  PLAY_MODES,
  type PlayMode,
  Preferences,
} from '@settings';
import { GameStore } from '@state';

const CONFIRM_WINDOW_MS = 4000;
const MOTIONS: readonly MotionSetting[] = ['system', 'full', 'reduced'];
const SECTIONS = ['game', 'app'] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Settings in two tabs: this game (how to play, mode and level, names, hints, a new series) and
 * the app (language, motion, design, opening the forced board).
 */
@Component({
  selector: 'app-settings-panel',
  imports: [Button, Choice, ChoiceGroup, Icon],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.css',
})
export class SettingsPanel {
  protected readonly translator = inject(Translator);
  protected readonly t = this.translator.t;
  protected readonly preferences = inject(Preferences);
  private readonly store = inject(GameStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  /** Asks the page to show the how-to-play ticket again. */
  readonly howToPlay = output();

  protected readonly nameMaxLength = NAME_MAX_LENGTH;

  /** The open tab: this game's settings, or the app's. */
  protected readonly section = signal<Section>('game');

  protected readonly tabs = computed(() =>
    SECTIONS.map((id) => ({ id, label: this.t().settings.sectionNames[id] })),
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

  /** Name fields: against the computer only the person has one. */
  protected readonly nameFields = computed((): readonly (0 | 1)[] =>
    this.preferences.mode() === 'opponent' ? [0] : [0, 1],
  );

  protected readonly designOptions = computed((): readonly ChoiceOption<Design>[] =>
    DESIGNS.map((design) => ({ value: design, label: this.t().settings.designs[design] })),
  );

  /** Leaving for the challenges drops a game under way (until phase 4 saves it): asks once more. */
  protected readonly confirmingChallenges = signal(false);
  private challengesTimer: ReturnType<typeof setTimeout> | undefined;

  /** "New series" asks once more before clearing the score; the question expires. */
  protected readonly confirmingReset = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * A mode or level picked while there is a score or a game under way: it waits for a second press,
   * like "New series", and the choice shown falls back when the question expires.
   */
  protected readonly pendingChange = signal<{ mode: PlayMode; level: OpponentLevel } | null>(null);
  private changeTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly shownMode = computed(
    () => this.pendingChange()?.mode ?? this.preferences.mode(),
  );
  protected readonly shownLevel = computed(
    () => this.pendingChange()?.level ?? this.preferences.level(),
  );

  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');
  private readonly handle = viewChild.required<ElementRef<HTMLElement>>('handle');
  /** Phones get a bottom sheet, which can be dragged down to close. */
  private readonly narrow = injectMediaQuery('(max-width: 34.99rem)');

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      clearTimeout(this.resetTimer);
      clearTimeout(this.changeTimer);
      clearTimeout(this.challengesTimer);
    });
    afterNextRender(() => {
      const sheet = this.sheet().nativeElement;
      const stop = swipeToClose(
        this.handle().nativeElement,
        sheet,
        () => sheet.hidePopover(),
        this.narrow,
      );
      destroyRef.onDestroy(stop);
    });
  }

  protected setMode(mode: PlayMode): void {
    this.requestChange({ mode, level: this.shownLevel() });
  }

  protected setLevel(level: OpponentLevel): void {
    this.requestChange({ mode: 'opponent', level });
  }

  protected confirmChange(): void {
    const change = this.pendingChange();
    if (change) {
      this.applyChange(change);
    }
  }

  /** Changing who plays starts a new series: at once when nothing is lost, else after confirming. */
  private requestChange(change: { mode: PlayMode; level: OpponentLevel }): void {
    clearTimeout(this.changeTimer);
    const current =
      change.mode === this.preferences.mode() && change.level === this.preferences.level();
    if (current) {
      this.pendingChange.set(null);
      return;
    }
    if (!this.store.seriesStarted()) {
      this.applyChange(change);
      return;
    }
    this.pendingChange.set(change);
    this.changeTimer = setTimeout(() => this.pendingChange.set(null), CONFIRM_WINDOW_MS);
  }

  private applyChange({ mode, level }: { mode: PlayMode; level: OpponentLevel }): void {
    clearTimeout(this.changeTimer);
    this.pendingChange.set(null);
    this.preferences.setMode(mode);
    this.preferences.setLevel(level);
    this.store.setMode(mode, level);
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

  /** Closes the sheet first: the ticket is a modal of its own, over the board. */
  protected openHowToPlay(): void {
    this.host.nativeElement.querySelector<HTMLElement>('[popover]')?.hidePopover();
    this.howToPlay.emit();
  }

  protected openChallenges(): void {
    if (this.store.seriesStarted() && !this.confirmingChallenges()) {
      this.confirmingChallenges.set(true);
      this.challengesTimer = setTimeout(
        () => this.confirmingChallenges.set(false),
        CONFIRM_WINDOW_MS,
      );
      return;
    }
    clearTimeout(this.challengesTimer);
    this.confirmingChallenges.set(false);
    this.sheet().nativeElement.hidePopover();
    void this.router.navigate(['/challenge']);
  }

  protected newSeries(): void {
    if (!this.confirmingReset()) {
      this.confirmingReset.set(true);
      this.resetTimer = setTimeout(() => this.confirmingReset.set(false), CONFIRM_WINDOW_MS);
      return;
    }
    clearTimeout(this.resetTimer);
    this.confirmingReset.set(false);
    this.store.newSeries();
  }
}
