import { Injectable, type OnDestroy, type Provider } from '@angular/core';
import type { Move } from '@core';
import type { OpponentReplyMessage, OpponentRequestMessage } from './opponent-message.model';
import { Opponent } from './opponent';
import type { OpponentRequest } from './opponent-request.model';

/** Least time before a reply shows, so the player sees their own move land first. */
export const OPPONENT_PACE_MS = 450;

interface Pending {
  readonly id: number;
  readonly resolve: (move: Move | null) => void;
  readonly reject: (error: Error) => void;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The opponent in a module Worker, started on first use. One request at a time: cancelling a busy
 * Worker terminates it (the next request starts a fresh one), and it ends with the route.
 */
@Injectable()
export class WorkerOpponent extends Opponent implements OnDestroy {
  private worker: Worker | undefined;
  private pending: Pending | undefined;
  private nextId = 0;

  reply(request: OpponentRequest): Promise<Move | null> {
    this.cancel();
    const id = ++this.nextId;
    const answer = new Promise<Move | null>((resolve, reject) => {
      this.pending = { id, resolve, reject };
    });
    const message: OpponentRequestMessage = { ...request, id };
    this.ensureWorker().postMessage(message);
    // Both the reply and the pace: a fast level never answers before the player's move settles.
    return Promise.all([answer, wait(OPPONENT_PACE_MS)]).then(([move]) => move);
  }

  cancel(): void {
    if (!this.pending) {
      return;
    }
    this.pending.resolve(null);
    this.pending = undefined;
    // A search may still be running; only terminating stops it.
    this.worker?.terminate();
    this.worker = undefined;
  }

  ngOnDestroy(): void {
    this.cancel();
    this.worker?.terminate();
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./opponent.worker', import.meta.url), { type: 'module' });
      this.worker.addEventListener('message', ({ data }: MessageEvent<OpponentReplyMessage>) =>
        this.settle(data),
      );
      this.worker.addEventListener('error', (event) => this.fail(new Error(event.message)));
      this.worker.addEventListener('messageerror', () =>
        this.fail(new Error('The opponent sent a reply that could not be read')),
      );
    }
    return this.worker;
  }

  private settle(reply: OpponentReplyMessage): void {
    const pending = this.pending;
    // A reply to a cancelled or replaced request is dropped.
    if (pending?.id !== reply.id) {
      return;
    }
    this.pending = undefined;
    if ('error' in reply) {
      pending.reject(new Error(reply.error));
    } else {
      pending.resolve(reply.move);
    }
  }

  /** A broken Worker (failed to load, crashed) is dropped: the next request starts a fresh one. */
  private fail(error: Error): void {
    this.pending?.reject(error);
    this.pending = undefined;
    this.worker?.terminate();
    this.worker = undefined;
  }
}

/** The opponent for the game route: a Worker, ended with the route. */
export function provideWorkerOpponent(): Provider {
  return { provide: Opponent, useClass: WorkerOpponent };
}
