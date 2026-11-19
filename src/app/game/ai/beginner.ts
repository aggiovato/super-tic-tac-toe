import { legalMoves, type GameState, type Move } from '@core';
import { pickWeighted, type Random } from './random';
import { winningMoves } from './tactics';

/** Centre, then corners, then edges: how much a beginner likes each cell of a board. */
const CELL_WEIGHT = [2, 1, 2, 1, 3, 1, 2, 1, 2] as const;

const cellWeight = (move: Move): number => CELL_WEIGHT[move.cell] ?? 1;

/**
 * Beginner: wins the game or a board when it can in one move, and otherwise plays a weighted random
 * legal move. It does not block and does not look at where its move sends the opponent, so it may
 * take a board that hands the opponent the game: that blind spot is what the intermediate level
 * removes. Only asked for positions that still have legal moves.
 */
export function beginnerMove(state: GameState, random: Random): Move {
  const wins = winningMoves(state);
  const candidates =
    wins.game.length > 0 ? wins.game : wins.board.length > 0 ? wins.board : legalMoves(state);
  return pickWeighted(candidates, cellWeight, random);
}
