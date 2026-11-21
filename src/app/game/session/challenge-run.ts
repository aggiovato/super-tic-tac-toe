import { computed, Injectable, signal } from '@angular/core';
import { type Challenge, CHALLENGES, challengeStart } from '@challenge';

/** The challenge being played on the challenge route; its session and opponent read it. */
@Injectable()
export class ChallengeRun {
  readonly challenge = signal<Challenge>(CHALLENGES[0]);
  /** The prepared position every attempt starts from. */
  readonly start = computed(() => challengeStart(this.challenge()));
  /** Called once an attempt is solved, with the challenge's id; the page records it. */
  onSolved: ((id: string) => void) | undefined;
}
