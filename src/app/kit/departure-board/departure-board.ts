import { Component, input } from '@angular/core';
import { SplitFlap } from '../split-flap/split-flap';
import type { FlapTile } from './flap-tile.model';

/** The departure row: who moves and where to. Its spoken form comes from `label`. */
@Component({
  selector: 'app-departure-board',
  imports: [SplitFlap],
  template: `
    <div class="flex gap-[0.08em]" role="img" [attr.aria-label]="label()">
      @for (tile of tiles(); track $index) {
        <app-split-flap
          [char]="tile.char"
          [accent]="tile.accent"
          [index]="$index"
          [maxSteps]="tile.steps ?? 6"
        />
      }
    </div>
  `,
})
export class DepartureBoard {
  readonly tiles = input.required<readonly FlapTile[]>();
  readonly label = input.required<string>();
}
