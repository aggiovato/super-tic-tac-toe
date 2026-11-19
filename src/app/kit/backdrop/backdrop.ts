import { Component } from '@angular/core';

/**
 * Page atmosphere: two torn-paper strips (the brand's own artwork), one low on the left under the
 * reading column and one high on the right, running off the edge. Softened so they read as
 * texture; their strength comes from tokens, so a design can turn them off.
 */
@Component({
  selector: 'app-backdrop',
  styleUrl: './backdrop.css',
  host: { 'aria-hidden': 'true' },
  template: `
    <span class="tear open-paper"></span>
    <span class="tear pointed-tear"></span>
  `,
})
export class Backdrop {}
