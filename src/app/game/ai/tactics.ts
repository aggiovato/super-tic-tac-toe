import { applyMove, legalMoves, type GameState, type Move, type MoveResult } from '@core';

type Accepted = Extract<MoveResult, { ok: true }>;

/**
 * Legal moves that win at once for the player to move, sorted in one pass over the engine (each
 * legal move is applied exactly once): `game` wins the whole game, `board` wins its board (a game
 * win also wins a board, so it appears in both).
 */
export function winningMoves(state: GameState): {
  readonly game: readonly Move[];
  readonly board: readonly Move[];
} {
  const game: Move[] = [];
  const board: Move[] = [];
  const accepted = legalMoves(state)
    .map((move) => ({ move, result: applyMove(state, move) }))
    .filter((entry): entry is { move: Move; result: Accepted } => entry.result.ok);
  for (const { move, result } of accepted) {
    if (result.state.status.kind === 'won') {
      game.push(move);
    }
    if (result.state.boards[move.board]?.kind === 'won') {
      board.push(move);
    }
  }
  return { game, board };
}
