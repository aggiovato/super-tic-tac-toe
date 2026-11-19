import { Component, ElementRef, input, viewChild } from '@angular/core';
import type { Segment } from './segment.model';

/**
 * The classic line through three in a row, drawn on over its container. `local` closes a single
 * board; `game` is the winning line across boards. The segment comes either from the `segment`
 * input or, when it depends on rendered layout, from `place()` during a render write phase.
 */
@Component({
  selector: 'app-strike-line',
  styleUrl: './strike-line.css',
  host: {
    'aria-hidden': 'true',
    '[class.game]': "variant() === 'game'",
    '[class.still]': '!animate()',
  },
  template: `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line
        #line
        pathLength="1"
        [attr.x1]="segment()?.x1"
        [attr.y1]="segment()?.y1"
        [attr.x2]="segment()?.x2"
        [attr.y2]="segment()?.y2"
      />
    </svg>
  `,
})
export class StrikeLine {
  readonly segment = input<Segment>();
  readonly variant = input<'local' | 'game'>('local');
  /** Draws on when it appears; false shows a line that was already drawn. */
  readonly animate = input(true);

  private readonly line = viewChild.required<ElementRef<SVGLineElement>>('line');

  /** Positions the line directly; call only from an `afterRenderEffect` write phase. */
  place(segment: Segment): void {
    const line = this.line().nativeElement;
    line.setAttribute('x1', String(segment.x1));
    line.setAttribute('y1', String(segment.y1));
    line.setAttribute('x2', String(segment.x2));
    line.setAttribute('y2', String(segment.y2));
  }
}
