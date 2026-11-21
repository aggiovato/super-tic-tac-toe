// Public API of the tactical challenges. Plain TypeScript: other layers import it as `@challenge`.
export type { Challenge, ChallengeLevel, ChallengeProgress } from './challenge.model';
export { CHALLENGES, findChallenge } from './challenges';
export { challengeStart, judge } from './judge';
