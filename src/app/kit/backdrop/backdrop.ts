import { Component } from '@angular/core';

/**
 * Page atmosphere, kept to the free corners: two thin torn strips and two oversized ghost marks
 * (an O low on the left, an X high on the right), cropped by the edges. Purely decorative; colour
 * and strength come from tokens, so a design can turn it off.
 */
@Component({
  selector: 'app-backdrop',
  styleUrl: './backdrop.css',
  host: { 'aria-hidden': 'true' },
  template: `
    <svg class="ghost ghost-o" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" /></svg>
    <svg class="ghost ghost-x" viewBox="0 0 100 100"><path d="M18 18l64 64M82 18 18 82" /></svg>
    <span class="tear tear-low"></span>
    <span class="tear tear-high"></span>
  `,
})
export class Backdrop {}
