import type { MatchResult } from './match.model';

/**
 * Where a game's moves go. Each game provides one on its route: the local session applies them with
 * its engine; later sessions add saving and the network behind the same two calls.
 */
export abstract class GameSession<S = unknown, M = unknown, R = unknown> {
  /** A new game of `variant` ('' for games that have one shape). */
  abstract start(variant: string): S;
  abstract play(state: S, move: M): MatchResult<S, R>;
}
