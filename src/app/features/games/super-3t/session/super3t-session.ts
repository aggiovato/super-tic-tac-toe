import { Injectable, type Provider } from '@angular/core';
import {
  applyMove,
  initialState,
  type GameState,
  type Move,
  type MoveResult,
  type RejectionReason,
} from '@super3t/core';
import { GameSession } from '@match';

/** Two people on one device: every move is applied by the engine, nothing else. */
@Injectable()
export class Super3tSession extends GameSession<GameState, Move, RejectionReason> {
  start(): GameState {
    return initialState();
  }

  play(state: GameState, move: Move): MoveResult {
    return applyMove(state, move);
  }
}

export function provideSuper3tSession(): Provider {
  return { provide: GameSession, useClass: Super3tSession };
}
