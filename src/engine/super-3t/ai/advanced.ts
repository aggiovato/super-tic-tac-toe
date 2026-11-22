import { applyMove, legalMoves, type GameState, type Move, type MoveResult } from '@super3t/core';
import { evaluate, WIN } from './evaluation';
import type { SearchLimits } from './models';
import type { Random } from '@tictac';
import { cellThreats } from './threats';
import { cellWeight } from '@tictac';

/** Thrown inside the search when the time is up; the depth in progress is discarded. */
class OutOfTime extends Error {}

/** No search goes deeper than this, so a won or lost line ends the deepening early. */
const MAX_DEPTH = 24;

/** How a leaf is valued for the player to move; injectable so offline batches can compare two. */
export type Evaluator = (state: GameState, player: GameState['turn']) => number;

/** What one search shares down the tree. */
interface Search {
  readonly ply: number;
  readonly limits: SearchLimits;
  readonly evaluator: Evaluator;
  /** Set when a line stopped at the depth limit rather than at the end of the game. */
  readonly horizon: { reached: boolean };
}

/** Cells that can still be played: empty cells of open boards. */
const playableCells = (state: GameState): number =>
  state.boards.reduce(
    (sum, board, index) =>
      sum +
      (board.kind === 'open'
        ? (state.cells[index] ?? []).filter((mark) => mark === null).length
        : 0),
    0,
  );

const sameMove = (a: Move | null, b: Move): boolean => a?.board === b.board && a.cell === b.cell;

/** The position after `move`; the move always comes from `legalMoves`, so it is accepted. */
function after(state: GameState, move: Move): GameState {
  const result: MoveResult = applyMove(state, move);
  if (!result.ok) {
    throw new Error(`The engine rejected a legal move: ${result.reason}`);
  }
  return result.state;
}

/**
 * Most promising moves first, so alpha-beta cuts more: the previous best, then cells that win a
 * board, then cells that block one, then centre, corners and edges. `jitter` (root only) breaks
 * ties with the seeded random, so games vary.
 */
function ordered(state: GameState, first: Move | null, jitter?: Random): Move[] {
  const them = state.turn === 'X' ? 'O' : 'X';
  const rank = (move: Move): number => {
    if (sameMove(first, move)) {
      return 1000;
    }
    const wins = cellThreats(state, move.board, state.turn).includes(move.cell) ? 100 : 0;
    const blocks = cellThreats(state, move.board, them).includes(move.cell) ? 50 : 0;
    return wins + blocks + cellWeight(move) + (jitter ? jitter() : 0);
  };
  return legalMoves(state)
    .map((move) => ({ move, rank: rank(move) }))
    .sort((a, b) => b.rank - a.rank)
    .map((entry) => entry.move);
}

/** Negamax with alpha-beta: the value of `state` for the player to move, `depth` plies ahead. */
function negamax(
  state: GameState,
  depth: number,
  window: { alpha: number; beta: number },
  search: Search,
): number {
  if (state.status.kind === 'won') {
    // The player who just moved won: a loss for the player to move.
    return -(WIN - search.ply);
  }
  if (state.status.kind === 'drawn') {
    return 0;
  }
  if (depth === 0) {
    search.horizon.reached = true;
    return search.evaluator(state, state.turn);
  }
  // Checked before ordering, so no node starts its work after the deadline.
  if (search.limits.expired()) {
    throw new OutOfTime();
  }
  let { alpha } = window;
  let best = -Infinity;
  for (const move of ordered(state, null)) {
    if (search.limits.expired()) {
      throw new OutOfTime();
    }
    const value = -negamax(
      after(state, move),
      depth - 1,
      { alpha: -window.beta, beta: -alpha },
      { ...search, ply: search.ply + 1 },
    );
    best = Math.max(best, value);
    alpha = Math.max(alpha, value);
    if (alpha >= window.beta) {
      break;
    }
  }
  return best;
}

/** One complete search of the root at `depth`: the best move and its value. */
function searchRoot(
  state: GameState,
  depth: number,
  previous: Move | null,
  context: { random: Random; search: Search },
): { move: Move; value: number } {
  let best: { move: Move; value: number } | null = null;
  let alpha = -Infinity;
  for (const move of ordered(state, previous, context.random)) {
    if (context.search.limits.expired()) {
      throw new OutOfTime();
    }
    const value = -negamax(
      after(state, move),
      depth - 1,
      { alpha: -Infinity, beta: -alpha },
      { ...context.search, ply: 1 },
    );
    if (!best || value > best.value) {
      best = { move, value };
      alpha = Math.max(alpha, value);
    }
  }
  if (!best) {
    throw new OutOfTime();
  }
  return best;
}

/**
 * Advanced: minimax with alpha-beta pruning, move ordering and iterative deepening. It searches
 * one ply deeper each round and keeps the best move of the last round it completed; a round cut
 * short by the clock is thrown away, and with no round complete it plays the prepared fallback.
 * The deepening ends early when a round is certain: a won or lost line, or every line it explored
 * reached the end of the game (a deeper round would search the same tree again).
 */
export function advancedMove(
  state: GameState,
  random: Random,
  limits: SearchLimits,
  evaluator: Evaluator = evaluate,
): Move {
  let best: Move | null = null;
  for (let depth = 1; depth <= Math.min(MAX_DEPTH, playableCells(state)); depth++) {
    const horizon = { reached: false };
    try {
      const round = searchRoot(state, depth, best, {
        random,
        search: { ply: 1, limits, evaluator, horizon },
      });
      best = round.move;
      if (Math.abs(round.value) >= WIN - MAX_DEPTH || !horizon.reached) {
        break;
      }
    } catch (error) {
      if (error instanceof OutOfTime) {
        break;
      }
      throw error;
    }
  }
  return best ?? limits.fallback;
}
