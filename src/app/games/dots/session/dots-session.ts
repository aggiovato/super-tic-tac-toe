import { Injectable, type Provider } from '@angular/core';
import {
  applyMove,
  type GameState,
  initialState,
  type Move,
  type MoveResult,
  type RejectionReason,
  sizeOfVariant,
} from '@dots/core';
import { GameSession, Opponent, WorkerOpponent } from '@match';

/** Every Dots and Boxes move is applied by its engine, on a board of the game's size. */
@Injectable()
export class DotsSession extends GameSession<GameState, Move, RejectionReason> {
  start(variant: string): GameState {
    return initialState(sizeOfVariant(variant));
  }

  play(state: GameState, move: Move): MoveResult {
    return applyMove(state, move);
  }
}

/** The Dots and Boxes opponent in its module Worker (`opponent.worker.ts`). */
@Injectable()
export class DotsOpponent extends WorkerOpponent<Move> {
  protected createWorker(): Worker {
    return new Worker(new URL('./opponent.worker', import.meta.url), { type: 'module' });
  }
}

/** The Dots and Boxes route's session and opponent. */
export function provideDotsMatch(): Provider[] {
  return [
    { provide: GameSession, useClass: DotsSession },
    { provide: Opponent, useClass: DotsOpponent },
  ];
}
