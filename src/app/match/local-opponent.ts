import type { OpponentRequest } from './match.model';
import { Opponent } from './opponent';

/** Least time before a reply shows, so the player sees their own move land first. */
export const OPPONENT_PACE_MS = 450;

/**
 * An opponent that thinks on the main thread: for work small enough not to block the board (a
 * solved game, a challenge's single ply). The reply comes at the same pace as a Worker's; null from
 * `choose` passes.
 */
export abstract class LocalOpponent<M> extends Opponent<M> {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private settle: ((move: M | null) => void) | undefined;

  protected abstract choose(request: OpponentRequest<M>): M | null;

  reply(request: OpponentRequest<M>): Promise<M | null> {
    this.cancel();
    const move = this.choose(request);
    return new Promise((resolve) => {
      this.settle = resolve;
      this.timer = setTimeout(() => {
        this.settle = undefined;
        resolve(move);
      }, OPPONENT_PACE_MS);
    });
  }

  cancel(): void {
    clearTimeout(this.timer);
    this.settle?.(null);
    this.settle = undefined;
  }
}
