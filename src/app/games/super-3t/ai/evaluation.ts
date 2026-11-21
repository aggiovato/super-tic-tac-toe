import type { GameState, Player } from '@super3t/core';
import { boardThreats, cellThreats } from './threats';

/** A won game, minus the plies it took: a quicker win scores higher, a later loss less badly. */
export const WIN = 100_000;

/** What the advanced level's static evaluation counts, for one player; the result is mine − theirs. */
const VALUE = {
  /** A board won, times its place on the big grid (centre 3, corners 2, edges 1). */
  board: 100,
  /** Two boards of a global line, the third still open. */
  globalThreat: 300,
  /** Two cells of a line on an open board, the third empty, times that board's place. */
  localThreat: 10,
  /** …when that board would also win the game. */
  decisiveLocalThreat: 120,
} as const;

/** Centre 3, corners 2, edges 1: where a board (or cell) sits on its grid. */
const PLACE = [2, 1, 2, 1, 3, 1, 2, 1, 2] as const;

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

function standing(state: GameState, player: Player): number {
  const decisive = boardThreats(state, player);
  let value = decisive.length * VALUE.globalThreat;
  for (const [board, status] of state.boards.entries()) {
    const place = PLACE[board] ?? 1;
    if (status.kind === 'won') {
      value += status.winner === player ? VALUE.board * place : 0;
    } else if (status.kind === 'open') {
      const threats = cellThreats(state, board, player).length;
      value +=
        threats *
        (decisive.includes(board) ? VALUE.decisiveLocalThreat : VALUE.localThreat * place);
    }
  }
  return value;
}

/** Static value of an unfinished position for `player`: its standing minus the opponent's. */
export function evaluate(state: GameState, player: Player): number {
  return standing(state, player) - standing(state, other(player));
}
