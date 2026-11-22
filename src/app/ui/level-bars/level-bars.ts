import { Component, computed, input } from '@angular/core';

/**
 * A level as rising bars, filled up to the level (▮▯▯, ▮▮▯, ▮▮▮): shape, not colour, so it reads
 * in every design and next to the player inks. Decorative; the text beside it names the level.
 */
@Component({
  selector: 'app-level-bars',
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-flex;
      align-items: flex-end;
      gap: 0.12em;
      height: 0.8em;
    }

    span {
      width: 0.22em;
      border-radius: 0.06em;
      background: currentColor;
      opacity: 0.3;
    }

    span.on {
      opacity: 1;
    }
  `,
  template: `
    @for (bar of bars(); track $index) {
      <span [class.on]="bar.on" [style.height.%]="bar.height"></span>
    }
  `,
})
export class LevelBars {
  /** Bars filled, from 1. */
  readonly value = input.required<number>();
  readonly max = input(3);

  protected readonly bars = computed(() =>
    Array.from({ length: this.max() }, (_, i) => ({
      on: i < this.value(),
      height: 45 + (55 * i) / Math.max(1, this.max() - 1),
    })),
  );
}
