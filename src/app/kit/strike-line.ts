import { Component, input } from '@angular/core';

/** A segment in percent of its container (0–100 on both axes). */
export interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/**
 * The classic line through three in a row, drawn on over its container. `game` is the winning
 * line across boards; `local` closes a single board.
 */
@Component({
  selector: 'app-strike-line',
  host: { 'aria-hidden': 'true', '[class.game]': "variant() === 'game'" },
  styles: `
    :host {
      --strike-colour: var(--color-win);
      --strike-width: 1.6; /* in viewBox units: percent of the container */
      --strike-time: calc(var(--duration-draw) * 0.6);
      --strike-delay: 0ms;

      position: absolute;
      z-index: 2;
      inset: 0;
      pointer-events: none;
      filter: drop-shadow(0 0.125rem 0.375rem var(--color-shade));
    }

    :host(.game) {
      --strike-width: 0.9;
      --strike-time: var(--duration-draw);
      --strike-delay: var(--duration-frame);
    }

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    line {
      stroke: var(--strike-colour);
      stroke-width: var(--strike-width);
      stroke-linecap: round;
      animation: draw var(--strike-time) var(--ease-out) var(--strike-delay) backwards;
    }

    /* The dash only exists while drawing, so the finished line has no seam. */
    @keyframes draw {
      from {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
      }

      to {
        stroke-dasharray: 1;
        stroke-dashoffset: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host-context(:root:not([data-motion='full'])) line {
        animation: none;
      }
    }
  `,
  template: `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <line
        pathLength="1"
        [attr.x1]="segment().x1"
        [attr.y1]="segment().y1"
        [attr.x2]="segment().x2"
        [attr.y2]="segment().y2"
      />
    </svg>
  `,
})
export class StrikeLine {
  readonly segment = input.required<Segment>();
  readonly variant = input<'local' | 'game'>('local');
}
