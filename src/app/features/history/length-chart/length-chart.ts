import { Component, computed, input } from '@angular/core';
import type { HistoryEntry, Outcome } from '../history-ticket/history.model';

/** A legend entry: an outcome and its name. */
type Legend = Readonly<Record<Outcome, string>>;

/**
 * Moves per game: the latest games as columns, oldest on the left, as tall as the game was long.
 * The fill tells the outcome by shape: a win solid in the win colour, a draw striped, a loss
 * outlined, a game between two people solid in the text colour. Spoken as one sentence (`label`);
 * the legend shows only the outcomes on the chart.
 */
@Component({
  selector: 'app-length-chart',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-stack-tight);
      font-size: var(--text-caption);
    }

    .bars {
      display: flex;
      align-items: flex-end;
      gap: 0.25rem;
      height: 4.5rem;
      padding-bottom: 0.25rem;
      border-bottom: var(--border-hairline) solid var(--color-line);
    }

    .bar,
    .key {
      border: var(--border-line) solid var(--color-fg);
      border-radius: var(--radius-cell);
    }

    .bar {
      flex: 1;
      max-width: 1rem;
      min-height: 0.375rem;
      border-bottom-width: 0;
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }

    .won {
      border-color: var(--color-win);
      background: var(--color-win);
    }

    .drawn {
      background: repeating-linear-gradient(-45deg, var(--color-fg) 0 2px, transparent 2px 5px);
    }

    .people {
      background: var(--color-fg);
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-stack-tight) var(--spacing-stack);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .legend li {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .key {
      width: 0.75rem;
      height: 0.75rem;
    }
  `,
  template: `
    <div class="bars" role="img" [attr.aria-label]="label()">
      @for (game of games(); track game.id) {
        <span
          class="bar"
          [class]="game.outcome"
          [style.height.%]="(game.moves / longest()) * 100"
        ></span>
      }
    </div>
    <ul class="legend" aria-hidden="true">
      @for (outcome of shown(); track outcome) {
        <li><span class="key" [class]="outcome"></span>{{ legend()[outcome] }}</li>
      }
    </ul>
  `,
})
export class LengthChart {
  /** The games, oldest first. */
  readonly games = input.required<readonly HistoryEntry[]>();
  readonly label = input.required<string>();
  readonly legend = input.required<Legend>();

  protected readonly longest = computed(() =>
    Math.max(1, ...this.games().map((game) => game.moves)),
  );

  /** The outcomes on the chart, in a fixed order. */
  protected readonly shown = computed((): Outcome[] =>
    (['won', 'drawn', 'lost', 'people'] as const).filter((outcome) =>
      this.games().some((game) => game.outcome === outcome),
    ),
  );
}
