import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { type Size, SIZES, sizeOfVariant, variantOf } from '@dots/core';
import { DotsStore } from '@dots/state';
import { Translator } from '@i18n';
import { Button, ChoiceGroup, type ChoiceOption } from '@kit';
import { Preferences } from '@preferences';
import { CONFIRM_WINDOW_MS, SettingsSheet } from '@shell';

/**
 * Dots and Boxes' own settings, projected into the shared sheet's Game tab: how to play and the
 * board size. A new size starts a new series, so with a game under way it waits for a second press.
 */
@Component({
  selector: 'app-dots-settings',
  imports: [Button, ChoiceGroup],
  templateUrl: './dots-settings.html',
  styleUrl: './dots-settings.css',
})
export class DotsSettings {
  protected readonly t = inject(Translator).t;
  private readonly store = inject(DotsStore);
  private readonly preferences = inject(Preferences);
  private readonly sheet = inject(SettingsSheet);

  /** Asks the page to show the how-to-play ticket again. */
  readonly howToPlay = output();

  protected readonly pending = signal<Size | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected readonly shown = computed(() => this.pending() ?? sizeOfVariant(this.store.variant()));

  protected readonly options = computed((): readonly ChoiceOption<string>[] =>
    SIZES.map((size) => ({ value: variantOf(size), label: this.t().dots.sizeName(size) })),
  );

  protected openHowToPlay(): void {
    this.sheet.close();
    this.howToPlay.emit();
  }

  /** Ignored until the saved match is back: the store would drop it and the restore overwrite it. */
  protected choose(variant: string): void {
    if (!this.store.ready()) {
      return;
    }
    clearTimeout(this.timer);
    const size = sizeOfVariant(variant);
    if (size === sizeOfVariant(this.store.variant())) {
      this.pending.set(null);
      return;
    }
    if (!this.store.seriesStarted()) {
      this.apply(size);
      return;
    }
    this.pending.set(size);
    this.timer = setTimeout(() => this.pending.set(null), CONFIRM_WINDOW_MS);
  }

  protected confirm(): void {
    const size = this.pending();
    if (size) {
      this.apply(size);
    }
  }

  private apply(size: Size): void {
    clearTimeout(this.timer);
    this.pending.set(null);
    const variant = variantOf(size);
    const { mode, level } = this.preferences.play().dots;
    this.preferences.setPlay('dots', { mode, level, variant });
    this.store.setMode(this.store.mode(), this.store.level(), variant);
  }
}
