/** What the player is looking at. Changing it never changes the game. */
export type View = { readonly kind: 'global' } | { readonly kind: 'board'; readonly board: number };

/** Participant index (0 or 1) in a series; symbols swap on every rematch. */
export type Participant = 0 | 1;

/** Who plays: two people on one device, or a person against the computer. */
export type Mode = 'humans' | 'opponent';
