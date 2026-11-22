import { SILENCE_MS } from '@protocol';

/** Sockets one seat may hold at once (a few tabs); one more is refused. */
export const MAX_SOCKETS_PER_SEAT = 4;

/** How often a room with players checks for sockets gone silent. */
export const SWEEP_MS = 30_000;

/** Messages a socket may send in a burst, and how many it earns back per second. */
const BURST = 20;
const PER_SECOND = 4;

/**
 * A socket's message budget (a token bucket): a burst of `BURST`, then `PER_SECOND` a second. Far
 * above what a player sends, so only a flood runs out. Kept in memory: a room that hibernates
 * forgets it, which only gives a fresh budget.
 */
export class MessageBudget {
  private tokens = BURST;

  constructor(private at: number) {}

  /** Spends one message; false once the budget is gone. */
  spend(now: number): boolean {
    this.tokens = Math.min(BURST, this.tokens + ((now - this.at) / 1000) * PER_SECOND);
    this.at = now;
    if (this.tokens < 1) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }
}

/** A socket last heard from at `lastSeen` is gone by `now` (its network was lost, not closed). */
export const isSilent = (lastSeen: number, now: number): boolean => now - lastSeen > SILENCE_MS;

/** The client's address, as Cloudflare gives it (kept through the app's service binding). */
export const clientKey = (request: Request): string =>
  request.headers.get('cf-connecting-ip') ?? 'unknown';
