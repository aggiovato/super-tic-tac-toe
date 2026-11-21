import { inject, Injectable } from '@angular/core';
import { judge } from '@super3t/challenge';
import {
  applyMove,
  type GameState,
  type Move,
  type MoveResult,
  type RejectionReason,
} from '@super3t/core';
import { ChallengeRun } from './challenge-run';
import { GameSession } from '@match';

/**
 * A challenge: every game starts from its prepared position and moves go to the engine. A move that
 * solves it tells the run, so the page can record it.
 */
@Injectable()
export class ChallengeSession extends GameSession<GameState, Move, RejectionReason> {
  private readonly run = inject(ChallengeRun);

  start(): GameState {
    return this.run.start();
  }

  play(state: GameState, move: Move): MoveResult {
    const result = applyMove(state, move);
    if (result.ok && judge(this.run.start(), result.state).kind === 'solved') {
      this.run.onSolved?.(this.run.challenge().id);
    }
    return result;
  }
}
