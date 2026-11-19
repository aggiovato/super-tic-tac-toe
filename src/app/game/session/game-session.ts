import type { GameState, Move, MoveResult } from '@core';

/**
 * Where moves go. The local session applies them with the engine; later sessions add saving,
 * the opponent's Worker and the network behind the same two calls.
 */
export abstract class GameSession {
  abstract start(): GameState;
  abstract play(state: GameState, move: Move): MoveResult;
}
