import { inject, Injectable } from '@angular/core';
import { defend } from '@ai';
import { judge } from '@challenge';
import { replay, type Move } from '@core';
import { ChallengeRun } from './challenge-run';
import { Opponent } from './opponent';
import type { OpponentRequest } from './opponent-request.model';
import { OPPONENT_PACE_MS } from './worker-opponent';

/**
 * The defender of a challenge. After the key move it replies (every reply loses); after any other
 * move, or a missed finish, it passes, so the attempt stops where it went wrong. Its work is a
 * single ply of replies, cheap enough for the main thread; the pace matches the Worker's.
 */
@Injectable()
export class ChallengeOpponent extends Opponent {
  private readonly run = inject(ChallengeRun);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private settle: ((move: Move | null) => void) | undefined;

  reply(request: OpponentRequest): Promise<Move | null> {
    this.cancel();
    const played = replay(request.moves, this.run.start().rulesVersion);
    const move =
      played.ok && judge(this.run.start(), played.state).kind === 'defending'
        ? defend(played.state)
        : null;
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
