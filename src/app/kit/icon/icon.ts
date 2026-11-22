import { Component, input } from '@angular/core';

export type IconName =
  'settings' | 'undo' | 'grid' | 'games' | 'fold' | 'close' | 'history' | 'check';

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
        @case ('games') {
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        }
        @case ('fold') {
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16M16 9l-3 3 3 3" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('history') {
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5M12 7v5l3 2" />
        }
        @case ('check') {
          <path d="m5 12 5 5 9-10" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
