// Test-only positions for the opponent, in `board.cell` notation (see @core/testing). Each one was
// found by playing seeded random games with the engine; the specs assert what makes it useful.
import { parseMoves } from '@core/testing';

/**
 * A 60-move game that keeps both players busy. At its end X has a free choice: 8.0 wins board 8
 * only, 4.2 wins board 4 and with it the game.
 */
export const LONG_GAME =
  '5.5 5.0 0.4 4.8 8.8 8.2 2.5 5.7 7.3 3.8 8.4 4.3 3.1 1.3 3.2 2.1 1.4 4.0 0.3 3.6 6.2 2.2 2.0 ' +
  '0.2 2.6 6.7 7.2 2.3 3.5 5.4 4.6 6.1 1.7 7.5 5.6 6.8 8.1 1.6 6.0 0.1 1.2 2.4 4.1 1.5 5.3 3.0 ' +
  '0.5 5.1 1.1 8.3 3.3 3.7 7.7 7.4 4.4 4.7 7.8 8.7 7.6 6.6';

/** The first `count` moves of `notation`. */
export function opening(notation: string, count: number): string {
  return parseMoves(notation)
    .slice(0, count)
    .map((move) => `${move.board}.${move.cell}`)
    .join(' ');
}

/** After 21 moves, forced to board 2: 2.0, 2.3 and 2.8 send the opponent to a board it can win. */
export const SENDS_TO_A_WIN = opening(LONG_GAME, 21);

/**
 * After 30 moves, forced to board 4, where the opponent has two winning cells (4.4 and 4.6): taking
 * one blocks nothing, and 4.4 also sends the opponent to a board it can win.
 */
export const IDLE_BLOCK = opening(LONG_GAME, 30);

/** After 52 moves, forced to board 7: 7.0, 7.1 and 7.4 let the opponent win the game next. */
export const CAN_HAND_THE_GAME = opening(LONG_GAME, 52);

/**
 * After 54 moves, forced to board 4, which would win the opponent the game: 4.4 takes its only
 * winning cell there, 4.5 hands the game over, 4.2 is also safe (it sends the opponent elsewhere).
 */
export const MUST_BLOCK_THE_GAME = opening(LONG_GAME, 54);

/**
 * O to move, forced to board 8 after 55 moves of another seeded game: only 8.8 wins by force (every
 * reply leaves O a game win). One reply ahead is not enough to see it: the intermediate plays 8.4.
 */
export const FORCED_WIN_IN_THREE =
  '1.7 7.7 7.1 1.6 6.6 6.5 5.2 2.8 8.1 1.4 4.6 6.4 4.2 2.7 7.3 3.6 6.3 3.2 2.3 3.8 8.7 7.4 4.8 ' +
  '8.2 2.5 5.3 3.0 0.7 7.2 2.2 2.1 1.0 0.6 6.7 7.0 0.0 0.3 3.3 3.5 5.4 4.4 8.6 6.2 2.0 0.4 2.4 ' +
  '5.1 1.5 5.6 6.1 1.3 3.4 5.0 0.1 1.8';
