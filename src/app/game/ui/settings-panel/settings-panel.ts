import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { type Lang, MESSAGES, Translator } from '@i18n';
import { Button, Choice, ChoiceGroup, type ChoiceOption, Icon } from '@kit';
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

/** Game mode and opponent level, player names, language, motion, hints, design and a new series. */
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

  protected readonly nameMaxLength = NAME_MAX_LENGTH;

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

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.resetTimer);
      clearTimeout(this.changeTimer);
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
