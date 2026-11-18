import { Component, input } from '@angular/core';

export type IconName = 'settings' | 'undo' | 'grid' | 'close';

/** Authored line icons in one stroke weight; decorative, so hidden from assistive tech. */
@Component({
  selector: 'app-icon',
  host: { 'aria-hidden': 'true', class: 'inline-flex' },
  styles: `
    svg {
      width: 1.1em;
      height: 1.1em;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  template: `
    <svg viewBox="0 0 24 24">
      @switch (name()) {
        @case ('settings') {
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        }
        @case ('undo') {
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
        }
        @case ('grid') {
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
