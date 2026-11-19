import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { type Lang, MESSAGES, Translator } from '@i18n';
import { Button, Choice, ChoiceGroup, type ChoiceOption, Icon } from '@kit';
import { type Design, DESIGNS, type MotionSetting, NAME_MAX_LENGTH, Preferences } from '@settings';
import { GameStore } from '@state';

const CONFIRM_WINDOW_MS = 4000;
const MOTIONS: readonly MotionSetting[] = ['system', 'full', 'reduced'];

/** Player names, language, motion, hints, design and starting a new series. */
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

  protected readonly designOptions = computed((): readonly ChoiceOption<Design>[] =>
    DESIGNS.map((design) => ({ value: design, label: this.t().settings.designs[design] })),
  );

  /** "New series" asks once more before clearing the score; the question expires. */
  protected readonly confirmingReset = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resetTimer));
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
