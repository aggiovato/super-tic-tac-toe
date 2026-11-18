import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MESSAGES, Translator } from '@i18n';
import { Button, Icon } from '@kit';
import { DESIGNS, NAME_MAX_LENGTH, Preferences, type MotionSetting } from '@settings';
import { GameStore } from '@state';

const CONFIRM_WINDOW_MS = 4000;

/** Player names, language, motion, hints, design and starting a new series. */
@Component({
  selector: 'app-settings-panel',
  imports: [Button, Icon],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.css',
})
export class SettingsPanel {
  protected readonly translator = inject(Translator);
  protected readonly t = this.translator.t;
  protected readonly preferences = inject(Preferences);
  private readonly store = inject(GameStore);

  protected readonly messages = MESSAGES;
  protected readonly designs = DESIGNS;
  protected readonly nameMaxLength = NAME_MAX_LENGTH;
  protected readonly motions: readonly MotionSetting[] = ['system', 'full', 'reduced'];

  /** "New series" asks once more before clearing the score; the question expires. */
  protected readonly confirmingReset = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resetTimer));
  }

  protected motionLabel(motion: MotionSetting): string {
    const s = this.t().settings;
    return motion === 'system'
      ? s.motionSystem
      : motion === 'full'
        ? s.motionFull
        : s.motionReduced;
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
