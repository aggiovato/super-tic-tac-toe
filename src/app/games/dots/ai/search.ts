import { Board } from './board';

/** Thrown when the deadline passes: the search's partial results are discarded. */
export class OutOfTime extends Error {}

/**
 * Exact value of the position for the player to move: the boxes they will still take minus the
 * boxes the opponent will, with perfect play. A move that closes a box keeps the turn, so its value
 * adds; any other move hands the turn over, so it negates. Memoised by the drawn lines (the future
 * does not depend on who drew them). `expired` is read at every node.
 */
export function solve(board: Board, memo: Map<string, number>, expired: () => boolean): number {
  if (board.remaining === 0) {
    return 0;
  }
  const key = board.key();
  const known = memo.get(key);
  if (known !== undefined) {
    return known;
  }
  if (expired()) {
    throw new OutOfTime();
  }
  let best = -Infinity;
  for (const line of ordered(board)) {
    const closed = board.draw(line);
    const value = closed > 0 ? closed + solve(board, memo, expired) : -solve(board, memo, expired);
    board.erase(line);
    best = Math.max(best, value);
  }
  memo.set(key, best);
  return best;
}

/** Closing moves first, then safe ones, then the rest: good moves early fill the memo sooner. */
export function ordered(board: Board): number[] {
  const open = board.open();
  const rank = (line: number): number => (board.closes(line) > 0 ? 0 : board.safe(line) ? 1 : 2);
  return open.sort((a, b) => rank(a) - rank(b));
}

/**
 * Boxes the player to move takes by closing greedily, then the boxes the opponent takes after the
 * cheapest line that is left to give: how much a forced sacrifice costs, seen one handover ahead.
 */
export function sacrificeCost(board: Board, line: number): number {
  board.draw(line);
  const taken: number[] = [];
  let gained = 0;
  for (let capture = closing(board); capture !== undefined; capture = closing(board)) {
    gained += board.draw(capture);
    taken.push(capture);
  }
  taken.reverse().forEach((capture) => board.erase(capture));
  board.erase(line);
  return gained;
}

const closing = (board: Board): number | undefined =>
  board.open().find((line) => board.closes(line) > 0);
