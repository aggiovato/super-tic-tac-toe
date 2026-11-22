import { Injectable, type Provider } from '@angular/core';
import { Opponent, WorkerOpponent as ModuleWorkerOpponent } from '@match';
import type { Move } from '@super3t/core';

/** Super 3T's opponent in its module Worker (`opponent.worker.ts`). */
@Injectable()
export class WorkerOpponent extends ModuleWorkerOpponent<Move> {
  protected createWorker(): Worker {
    return new Worker(new URL('./opponent.worker', import.meta.url), { type: 'module' });
  }
}

/** The opponent for the game route: a Worker, ended with the route. */
export function provideWorkerOpponent(): Provider {
  return { provide: Opponent, useClass: WorkerOpponent };
}
