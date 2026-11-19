import type { GameState, Move, Player } from '@core';
import type { MoveOutcome, SearchLimits } from './models';
import { pickWeighted, type Random } from './random';
import { outcomes, winningMoves } from './tactics';
import { boardThreats, cellThreats } from './threats';
import { cellWeight } from './weights';

/** How much each consequence of a move is worth to the intermediate level. */
const SCORE = {
  /** The opponent could win the game with its reply: only played when nothing else is left. */
  handsTheGame: -1000,
  winsBoard: 100,
  /** Winning a board that leaves two of ours in a global line with the third still open. */
  makesGlobalThreat: 50,
  /** Winning a board the opponent needs for its own global line. */
  takesTheirBoard: 80,
  /** Playing the only cell where the opponent would win this board (with two, a block is idle). */
  blocksBoard: 60,
  /** …and that board would have won them the game. */
  blocksTheGame: 120,
  /** Sending the opponent to a board it can win at once. */
  givesBoard: -50,
  /** Sending the opponent to a closed board, so it picks any board it likes. */
  givesFreeChoice: -20,
} as const;

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

/** Whether `move` takes the one cell where `player` would win its board: a block that holds. */
function blocksTheOnlyThreat(state: GameState, move: Move, player: Player): boolean {
  const threats = cellThreats(state, move.board, player);
  return threats.length === 1 && threats[0] === move.cell;
}

/** What `outcome` is worth to the player who moves in `state`, looking one reply ahead. */
function score(state: GameState, { move, next, winsBoard }: MoveOutcome): number {
  const reply = winningMoves(next);
  if (reply.game.length > 0) {
    return SCORE.handsTheGame;
  }
  const me = state.turn;
  const them = other(me);
  const theirBoards = boardThreats(state, them);
  let value = 0;
  if (winsBoard) {
    value += SCORE.winsBoard;
    value +=
      boardThreats(next, me).length > boardThreats(state, me).length ? SCORE.makesGlobalThreat : 0;
    value += theirBoards.includes(move.board) ? SCORE.takesTheirBoard : 0;
  } else if (blocksTheOnlyThreat(state, move, them)) {
    value += theirBoards.includes(move.board) ? SCORE.blocksTheGame : SCORE.blocksBoard;
  }
  value += reply.board.length > 0 ? SCORE.givesBoard : 0;
  value += next.target.kind === 'free' ? SCORE.givesFreeChoice : 0;
  return value;
}

/**
 * Intermediate: wins the game when it can, never hands the opponent the game if another move is
 * left, and otherwise weighs board wins, global threats and blocks against where its move sends
 * the opponent (a board it can win, or a free choice). Ties go to a weighted random pick. When its
 * time runs out it plays the best move scored so far, or the prepared fallback if there is none.
 */
export function intermediateMove(state: GameState, random: Random, limits: SearchLimits): Move {
  const options = outcomes(state);
  const winning = options.filter((outcome) => outcome.winsGame).map((outcome) => outcome.move);
  if (winning.length > 0) {
    return pickWeighted(winning, cellWeight, random);
  }
  let best = -Infinity;
  let top: Move[] = [];
  for (const outcome of options) {
    if (limits.expired()) {
      break;
    }
    const value = score(state, outcome);
    if (value > best) {
      best = value;
      top = [outcome.move];
    } else if (value === best) {
      top.push(outcome.move);
    }
  }
  return top.length > 0 ? pickWeighted(top, cellWeight, random) : limits.fallback;
}
