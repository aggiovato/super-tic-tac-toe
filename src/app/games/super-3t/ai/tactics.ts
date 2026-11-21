import { applyMove, legalMoves, type GameState, type Move, type MoveResult } from '@super3t/core';
import type { MoveOutcome } from './models';

type Accepted = Extract<MoveResult, { ok: true }>;

/** Every legal move with the position it leads to; each one is applied exactly once. */
export function outcomes(state: GameState): MoveOutcome[] {
  return legalMoves(state)
    .map((move) => ({ move, result: applyMove(state, move) }))
    .filter((entry): entry is { move: Move; result: Accepted } => entry.result.ok)
    .map(({ move, result }) => ({
      move,
      next: result.state,
      winsBoard: result.state.boards[move.board]?.kind === 'won',
      winsGame: result.state.status.kind === 'won',
    }));
}

/**
 * Legal moves that win at once for the player to move: `game` wins the whole game, `board` wins its
 * board (a game win also wins a board, so it appears in both).
 */
export function winningMoves(state: GameState): {
  readonly game: readonly Move[];
  readonly board: readonly Move[];
} {
  const all = outcomes(state);
  return {
    game: all.filter((outcome) => outcome.winsGame).map((outcome) => outcome.move),
    board: all.filter((outcome) => outcome.winsBoard).map((outcome) => outcome.move),
  };
}
