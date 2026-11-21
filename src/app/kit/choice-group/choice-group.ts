import { Component, input, output } from '@angular/core';
import { Choice } from '../choice/choice';
import type { ChoiceOption } from './choice-option.model';

/**
 * A titled set of radios: one option of `options` is `selected`; picking another emits `chosen`.
 * `segmented` lays short options side by side on one track; the radios stay native underneath.
 */
@Component({
  selector: 'app-choice-group',
  imports: [Choice],
  templateUrl: './choice-group.html',
  styleUrl: './choice-group.css',
})
export class ChoiceGroup<T extends string> {
  readonly legend = input.required<string>();
  /** Radio group name, unique on the page. */
  readonly name = input.required<string>();
  readonly options = input.required<readonly ChoiceOption<T>[]>();
  readonly selected = input.required<T>();
  readonly layout = input<'list' | 'segmented'>('list');

  readonly chosen = output<T>();
}
