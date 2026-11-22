import { Component, input, output } from '@angular/core';

/**
 * A radio or checkbox with its label (projected) and an optional hint, drawn from tokens instead of
 * the browser's grey. Emits `changed` when the player picks it.
 */
@Component({
  selector: 'app-choice',
  templateUrl: './choice.html',
  styleUrl: './choice.css',
})
export class Choice {
  readonly type = input<'radio' | 'checkbox'>('checkbox');
  /** Radio group name. */
  readonly name = input<string>();
  readonly checked = input(false);
  /** Smaller line under the label. */
  readonly hint = input<string>();
  /** Language of the label, when it differs from the page (a language's own name). */
  readonly lang = input<string>();

  readonly changed = output();
}
