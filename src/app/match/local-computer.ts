import type { ComputerRequest } from './match.model';
import { ComputerPlayer } from './computer';

/** Least time before a reply shows, so the player sees their own move land first. */
export const COMPUTER_PACE_MS = 450;

/**
 * An opponent that thinks on the main thread: for work small enough not to block the board (a
 * solved game, a challenge's single ply). The reply comes at the same pace as a Worker's; null from
 * `choose` passes.
 */
export abstract class LocalComputer<M> extends ComputerPlayer<M> {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private settle: ((move: M | null) => void) | undefined;

  protected abstract choose(request: ComputerRequest<M>): M | null;

  reply(request: ComputerRequest<M>): Promise<M | null> {
    this.cancel();
    const move = this.choose(request);
    return new Promise((resolve) => {
      this.settle = resolve;
      this.timer = setTimeout(() => {
        this.settle = undefined;
        resolve(move);
      }, COMPUTER_PACE_MS);
    });
  }

  cancel(): void {
    clearTimeout(this.timer);
    this.settle?.(null);
    this.settle = undefined;
  }
}
