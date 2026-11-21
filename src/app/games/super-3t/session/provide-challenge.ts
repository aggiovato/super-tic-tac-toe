import type { Provider } from '@angular/core';
import { ChallengeOpponent } from './challenge-opponent';
import { ChallengeRun } from './challenge-run';
import { ChallengeSession } from './challenge-session';
import { GameSession } from '@match';
import { Opponent } from '@match';

/** The challenge route: the run, a session starting from its position and its defender. */
export function provideChallenge(): Provider[] {
  return [
    ChallengeRun,
    { provide: GameSession, useClass: ChallengeSession },
    { provide: Opponent, useClass: ChallengeOpponent },
  ];
}
