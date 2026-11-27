import { Component, input } from '@angular/core';
import { SplitFlap } from '../split-flap/split-flap';
import type { FlapTile } from './flap-tile.model';

/** The departure row: who moves and where to. Its spoken form comes from `label`. */
@Component({
  selector: 'app-departure-board',
  imports: [SplitFlap],
  styles: `
    /* A dimmed tile steps back (the player who waits) without changing its ink. */
    .dim {
      opacity: 0.4;
      transition: opacity var(--duration-quick) var(--ease-out);
    }
  `,
  template: `
    <div class="flex gap-[0.08em]" role="img" [attr.aria-label]="label()">
      @for (tile of tiles(); track $index) {
        <app-split-flap
          [char]="tile.char"
          [accent]="tile.accent"
          [index]="$index"
          [maxSteps]="tile.steps ?? 6"
          [spin]="tile.spin ?? 0"
          [style.--flap-fg]="inkOf(tile)"
          [style.--flap-mark]="inkOf(tile)"
          [class.dim]="tile.dim"
        />
      }
    </div>
  `,
})
export class DepartureBoard {
  readonly tiles = input.required<readonly FlapTile[]>();
  readonly label = input.required<string>();

  protected inkOf({ ink }: FlapTile): string | null {
    if (!ink) return null;
    return ink === 'hit' ? 'var(--color-hit)' : `var(--color-player-${ink})`;
  }
}
