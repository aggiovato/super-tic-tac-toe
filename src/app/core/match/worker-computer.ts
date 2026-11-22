import { Injectable, type OnDestroy } from '@angular/core';
import { COMPUTER_PACE_MS } from './local-computer';
import type { ComputerRequest } from './match.model';
import { ComputerPlayer } from './computer';

/** Main thread → Worker: one request, tagged so its reply can be matched. */
export interface ComputerRequestMessage<M> extends ComputerRequest<M> {
  readonly id: number;
}

/** Worker → main thread: the reply to request `id`, or why there is none. */
export type ComputerReplyMessage<M> =
  | { readonly id: number; readonly move: M | null }
  | { readonly id: number; readonly error: string };

interface Pending<M> {
  readonly id: number;
  readonly resolve: (move: M | null) => void;
  readonly reject: (error: Error) => void;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * An opponent in a module Worker, started on first use. One request at a time: cancelling a busy
 * Worker terminates it (the next request starts a fresh one), and it ends with the route. Each
 * game names its Worker in `createWorker` (the bundler needs the literal `new URL(...)` there).
 */
@Injectable()
export abstract class WorkerComputer<M> extends ComputerPlayer<M> implements OnDestroy {
  private worker: Worker | undefined;
  private pending: Pending<M> | undefined;
  private nextId = 0;

  reply(request: ComputerRequest<M>): Promise<M | null> {
    this.cancel();
    const id = ++this.nextId;
    const answer = new Promise<M | null>((resolve, reject) => {
      this.pending = { id, resolve, reject };
    });
    const message: ComputerRequestMessage<M> = { ...request, id };
    this.ensureWorker().postMessage(message);
    // Both the reply and the pace: a fast level never answers before the player's move settles.
    return Promise.all([answer, wait(COMPUTER_PACE_MS)]).then(([move]) => move);
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

  protected abstract createWorker(): Worker;

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = this.createWorker();
      this.worker.addEventListener('message', ({ data }: MessageEvent<ComputerReplyMessage<M>>) =>
        this.settle(data),
      );
      this.worker.addEventListener('error', (event) => this.fail(new Error(event.message)));
      this.worker.addEventListener('messageerror', () =>
        this.fail(new Error('The opponent sent a reply that could not be read')),
      );
    }
    return this.worker;
  }

  private settle(reply: ComputerReplyMessage<M>): void {
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
