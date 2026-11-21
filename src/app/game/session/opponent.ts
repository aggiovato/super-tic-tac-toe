import type { Move } from '@core';
import type { OpponentRequest } from './opponent-request.model';

/**
 * The computer player. `reply` resolves with a move for the player to move, or null to pass (the
 * game is over, or a challenge it no longer defends), and rejects when the opponent fails; `cancel` drops the request in flight, which then
 * resolves null. Callers only act on the reply to their latest request.
 */
export abstract class Opponent {
  abstract reply(request: OpponentRequest): Promise<Move | null>;
  abstract cancel(): void;
}
