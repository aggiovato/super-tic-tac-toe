// Canonical move sequences in `board.cell` notation (see notation.ts). Each one was checked
// against the engine; the specs assert the property that makes it interesting.

/** X closes board 2 (cells 0, 1, 2) by playing its cell 2, which points back to board 2. */
export const CLOSES_OWN_TARGET = '4.0 0.2 2.0 0.4 4.1 1.2 2.1 1.4 4.3 3.2 2.2';

/** Board 1 is drawn; the last move (O on 5.1) points to it while the game goes on. */
export const POINTS_TO_DRAWN_BOARD =
  '1.5 5.6 6.8 8.4 4.1 1.4 4.6 6.7 7.5 5.4 4.3 3.5 5.0 0.2 2.8 8.1 1.0 0.1 1.1 1.2 2.1 1.7 ' +
  '7.6 6.1 1.8 8.2 2.2 2.3 3.1 1.3 3.7 7.1 1.6 6.5 5.1';

/** X wins boards 0 and 8, then wins board 4 with the last move: the 0-4-8 global diagonal. */
export const GLOBAL_DIAGONAL_WIN =
  '8.6 6.4 4.5 5.2 2.7 7.0 0.3 3.0 0.0 0.8 8.3 3.8 8.0 0.4 4.2 2.0 0.6 6.0 4.8';

/** Every board closes with no global line: the game ends drawn. */
export const GLOBAL_DRAW =
  '3.7 7.8 8.6 6.4 4.1 1.0 0.6 6.3 3.4 4.4 4.2 2.3 3.1 1.8 8.0 0.3 4.0 0.8 8.3 1.4 2.5 5.2 ' +
  '2.2 2.7 7.5 5.5 5.1 5.8 2.8 6.5 7.0 0.5 7.6 0.2 7.3';
