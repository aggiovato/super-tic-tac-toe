import type { OpponentRequest } from './match.model';

/**
 * The computer player of a game. `reply` resolves with a move for the player to move, or null to
 * pass (the game is over, or a challenge it no longer defends), and rejects when the opponent
 * fails; `cancel` drops the request in flight, which then resolves null. Callers only act on the
 * reply to their latest request.
 */
export abstract class Opponent<M = unknown> {
  abstract reply(request: OpponentRequest<M>): Promise<M | null>;
  abstract cancel(): void;
}
