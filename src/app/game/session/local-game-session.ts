import { Injectable, type Provider } from '@angular/core';
import { applyMove, initialState, type GameState, type Move, type MoveResult } from '@core';
import { GameSession } from './game-session';

/** Two people on one device: every move is applied by the engine, nothing else. */
@Injectable()
export class LocalGameSession extends GameSession {
  start(): GameState {
    return initialState();
  }

  play(state: GameState, move: Move): MoveResult {
    return applyMove(state, move);
  }
}

export function provideLocalGameSession(): Provider {
  return { provide: GameSession, useClass: LocalGameSession };
}
