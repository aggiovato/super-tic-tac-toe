import { inject, Injectable } from '@angular/core';
import { defend } from '@super3t/ai';
import { judge } from '@super3t/challenge';
import { replay, type Move } from '@super3t/core';
import { ChallengeRun } from './challenge-run';
import { LocalComputer, type ComputerRequest } from '@match';

/**
 * The defender of a challenge. After the key move it replies (every reply loses); after any other
 * move, or a missed finish, it passes, so the attempt stops where it went wrong. Its work is a
 * single ply of replies, cheap enough for the main thread.
 */
@Injectable()
export class ChallengeComputer extends LocalComputer<Move> {
  private readonly run = inject(ChallengeRun);

  protected choose(request: ComputerRequest<Move>): Move | null {
    const played = replay(request.moves, this.run.start().rulesVersion);
    return played.ok && judge(this.run.start(), played.state).kind === 'defending'
      ? defend(played.state)
      : null;
  }
}
