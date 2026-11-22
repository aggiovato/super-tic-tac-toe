import { Injectable, type Provider } from '@angular/core';
import { ComputerPlayer, WorkerComputer as ModuleWorkerComputer } from '@match';
import type { Move } from '@super3t/core';

/** Super 3T's computer player in its module Worker (`computer.worker.ts`). */
@Injectable()
export class WorkerComputer extends ModuleWorkerComputer<Move> {
  protected createWorker(): Worker {
    return new Worker(new URL('./computer.worker', import.meta.url), { type: 'module' });
  }
}

/** The opponent for the game route: a Worker, ended with the route. */
export function provideWorkerComputer(): Provider {
  return { provide: ComputerPlayer, useClass: WorkerComputer };
}
