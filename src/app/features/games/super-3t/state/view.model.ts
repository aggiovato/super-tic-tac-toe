/** What the player is looking at. Changing it never changes the game. */
export type View = { readonly kind: 'global' } | { readonly kind: 'board'; readonly board: number };
