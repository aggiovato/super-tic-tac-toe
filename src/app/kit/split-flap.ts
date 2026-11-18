import { NgTemplateOutlet } from '@angular/common';
import { Component, input, linkedSignal } from '@angular/core';

/**
 * One tile of the departure row. When its character changes the old top half falls and the new
 * bottom half lands, like a split-flap display. With reduced motion the new character appears at
 * once.
 */
@Component({
  selector: 'app-split-flap',
  imports: [NgTemplateOutlet],
  templateUrl: './split-flap.html',
  styleUrl: './split-flap.css',
  host: {
    'aria-hidden': 'true',
    '[class.accent]': 'accent()',
    '[style.--flap-index]': 'index()',
  },
})
export class SplitFlap {
  readonly char = input.required<string>();
  readonly accent = input(false);
  /** Position in the row; staggers the fall from left to right. */
  readonly index = input(0);

  /** Character shown before the latest change. */
  protected readonly previous = linkedSignal<string, string>({
    source: this.char,
    computation: (current, before) => before?.source ?? current,
  });
}
