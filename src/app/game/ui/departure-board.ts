import { Component, input } from '@angular/core';
import { SplitFlap } from '@kit';

export interface FlapTile {
  readonly char: string;
  readonly accent: boolean;
  /** Most intermediate characters on the way to this one (longer for the result cascade). */
  readonly steps?: number;
}

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
