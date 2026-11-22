import { type GameState, legalMoves, type Move } from '@dots/core';
import { createRandom, pickWeighted, type Random, turnSeed } from '@tictac';
import { Board } from './board';
import { sacrificeCost, solve } from './search';

/** How strong the Dots and Boxes opponent plays, weakest first. */
export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/** Thinking time per level, as in Super 3T. */
export const BUDGET_MS: Readonly<Record<Level, number>> = {
  beginner: 50,
  intermediate: 200,
  advanced: 600,
};

/**
 * Lines left from which the advanced level searches the rest of the game exactly. The exact search
 * visits every set of the remaining lines (2^n): 15 is about 125 ms in Node, inside the budget on a
 * phone too.
 */
export const EXACT_LINES = 15;

export interface ComputerOptions {
  readonly level: Level;
  /** Integer seed for the whole game; each turn mixes it with the revision. */
  readonly seed: number;
  /** Monotonic clock in ms; tests pass a counter to bound the work instead of the time. */
  readonly now?: () => number;
}

const pick = (lines: readonly number[], random: Random): number =>
  pickWeighted(lines, () => 1, random);

/** Closing moves, safe moves and the rest, for the player to move. */
function classify(board: Board) {
  const open = board.open();
  return {
    open,
    closing: open.filter((line) => board.closes(line) > 0),
    safe: open.filter((line) => board.closes(line) === 0 && board.safe(line)),
  };
}

/** Closes a box when it can, else draws any line: it never looks at what a line gives away. */
function beginner(board: Board, random: Random): number {
  const { open, closing } = classify(board);
  return pick(closing.length > 0 ? closing : open, random);
}

/**
 * Closes a box when it can; else draws a line that gives nothing away; with none left, gives the
 * opponent the fewest boxes it can.
 */
function intermediate(board: Board, random: Random): number {
  const { open, closing, safe } = classify(board);
  if (closing.length > 0) {
    return pick(closing, random);
  }
  if (safe.length > 0) {
    return pick(safe, random);
  }
  const costs = open.map((line) => sacrificeCost(board, line));
  const cheapest = Math.min(...costs);
  return pick(
    open.filter((_, i) => costs[i] === cheapest),
    random,
  );
}

/**
 * Plays like the intermediate while more than `EXACT_LINES` lines are left; from there it searches
 * the rest of the game exactly (chains, the double-cross and control come out of the search) and
 * keeps the intermediate's move if time runs out.
 */
function advanced(board: Board, random: Random, expired: () => boolean): number {
  const { open, closing, safe } = classify(board);
  if (board.remaining > EXACT_LINES) {
    // Too many lines for an exact search (2^n positions): the intermediate's choice, closing first.
    return safe.length > 0
      ? pick(closing.length > 0 ? closing : safe, random)
      : intermediate(board, random);
  }
  const fallback = intermediate(board, random);
  try {
    const memo = new Map<string, number>();
    const values = open.map((line) => {
      const closed = board.draw(line);
      const value =
        closed > 0 ? closed + solve(board, memo, expired) : -solve(board, memo, expired);
      board.erase(line);
      return value;
    });
    const best = Math.max(...values);
    return pick(
      open.filter((_, i) => values[i] === best),
      random,
    );
  } catch {
    // Out of time (or any failure of the search): the intermediate's move stands.
    return fallback;
  }
}

/**
 * The Dots and Boxes opponent's line for the player to move, or null once the game is over. Seeded
 * by the game and the revision, so the same game replays the same choices.
 */
export function chooseMove(state: GameState, options: ComputerOptions): Move | null {
  if (!LEVELS.includes(options.level)) {
    throw new Error(`Unknown level: ${String(options.level)}`);
  }
  if (legalMoves(state).length === 0) {
    return null;
  }
  const now = options.now ?? (() => performance.now());
  const deadline = now() + BUDGET_MS[options.level];
  const random = createRandom(turnSeed(options.seed, state.revision));
  const board = new Board(state.size, state);
  const line =
    options.level === 'beginner'
      ? beginner(board, random)
      : options.level === 'intermediate'
        ? intermediate(board, random)
        : advanced(board, random, () => now() > deadline);
  return board.move(line);
}
