import { Component, input } from '@angular/core';
import { LevelBars } from '@ui';
import type { FormRow } from './form-row.model';

/**
 * Form by level: one row per computer level, its latest games as marks in the order they were
 * played. The outcome is told by shape, not only colour: a win is a filled disc in the win colour, a
 * draw half filled, a loss an empty ring. Each row is spoken as one sentence (`label`).
 */
@Component({
  selector: 'app-form-chart',
  imports: [LevelBars],
  styles: `
    :host {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: var(--spacing-stack-tight) var(--spacing-stack);
      font-size: var(--text-caption);
    }

    .name {
      display: flex;
      align-items: center;
      gap: var(--spacing-stack-tight);
      color: var(--color-fg);
    }

    .marks {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      min-height: 0.75rem;
    }

    .mark {
      width: 0.75rem;
      aspect-ratio: 1;
      border: var(--border-line) solid var(--color-fg);
      border-radius: var(--radius-pill);
    }

    .won {
      border-color: var(--color-win);
      background: var(--color-win);
    }

    .drawn {
      background: linear-gradient(90deg, var(--color-fg) 50%, transparent 50%);
    }

    .none {
      color: var(--color-fg-disabled);
    }
  `,
  template: `
    @for (row of rows(); track row.level) {
      <span class="name">
        <app-level-bars [value]="row.bars" />
        {{ row.name }}
      </span>
      <span class="marks" role="img" [attr.aria-label]="row.label">
        @for (outcome of row.form; track $index) {
          <span class="mark" [class]="outcome"></span>
        } @empty {
          <span class="none" aria-hidden="true">—</span>
        }
      </span>
    }
  `,
})
export class FormChart {
  readonly rows = input.required<readonly FormRow[]>();
}
