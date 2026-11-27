/**
 * The page's two layouts, the one source for both CSS and code: `scripts/check-tokens.mjs` fails
 * when a stylesheet's media query for them reads anything but these words.
 */
/** Two columns (the side column and the board): landscape screens from 48rem wide (5:4). */
export const WIDE_LAYOUT = '(min-width: 48rem) and (min-aspect-ratio: 5 / 4)';
/** One column: phones, upright tablets and narrow windows (everything not wide). */
export const NARROW_LAYOUT = '(max-width: 47.99rem), (max-aspect-ratio: 1249 / 1000)';
