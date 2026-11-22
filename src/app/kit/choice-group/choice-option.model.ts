/** One option of a `ChoiceGroup`. */
export interface ChoiceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** Language of the label, when it differs from the page. */
  readonly lang?: string;
  /** A level shown as rising bars after the label (the opponent's level). */
  readonly bars?: number;
}
