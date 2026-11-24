import { Injectable, type Provider } from '@angular/core';
import {
  applyMove,
  type GameState,
  initialState,
  type Move,
  type MoveResult,
  type RejectionReason,
} from '@fleet/core';
import { ComputerPlayer, GameSession, WorkerComputer } from '@match';

/** Every Ship Sink move is applied by its engine; the game has one shape. */
@Injectable()
export class FleetSession extends GameSession<GameState, Move, RejectionReason> {
  start(): GameState {
    return initialState();
  }

  play(state: GameState, move: Move): MoveResult {
    return applyMove(state, move);
  }
}

/** The Ship Sink computer player in its module Worker (`computer.worker.ts`). */
@Injectable()
export class FleetComputer extends WorkerComputer<Move> {
  protected createWorker(): Worker {
    return new Worker(new URL('./computer.worker', import.meta.url), { type: 'module' });
  }
}

/** The Ship Sink route's session and computer player. */
export function provideFleetMatch(): Provider[] {
  return [
    { provide: GameSession, useClass: FleetSession },
    { provide: ComputerPlayer, useClass: FleetComputer },
  ];
}
