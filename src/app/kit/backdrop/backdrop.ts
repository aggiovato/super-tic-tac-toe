import { Component } from '@angular/core';

/**
 * Page atmosphere: one thin torn strip in the secondary colour, low on the left, running down to
 * a point. Purely decorative; colour and strength come from tokens, so a design can turn it off.
 */
@Component({
  selector: 'app-backdrop',
  styleUrl: './backdrop.css',
  host: { 'aria-hidden': 'true' },
  template: '<span class="tear"></span>',
})
export class Backdrop {}
