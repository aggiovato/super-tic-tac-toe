/** Where the next move may be played. */
export type Target =
  | { readonly kind: 'free' }
  | { readonly kind: 'forced'; readonly board: number }
  | { readonly kind: 'game-over' };
