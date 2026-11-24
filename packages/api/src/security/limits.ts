import { SILENCE_MS } from '@protocol';

/** Sockets one seat may hold at once (a few tabs); one more is refused. */
export const MAX_SOCKETS_PER_SEAT = 4;

/** How often a room with players checks for sockets gone silent. */
export const SWEEP_MS = 30_000;

/**
 * A budget of messages (a token bucket): a burst of `burst`, then `perSecond` earned back each
 * second. Kept in memory: a room that hibernates forgets it, which only gives a fresh budget.
 */
class TokenBucket {
  private tokens: number;

  constructor(
    private at: number,
    private readonly burst: number,
    private readonly perSecond: number,
  ) {
    this.tokens = burst;
  }

  /** Spends one message; false once the budget is gone. */
  spend(now: number): boolean {
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.at) / 1000) * this.perSecond);
    this.at = now;
    if (this.tokens < 1) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }
}

/**
 * A socket's message budget: a burst of 20, then 4 a second. Far above what a player sends, so only
 * a flood runs out (the socket is then closed).
 */
export class MessageBudget extends TokenBucket {
  constructor(at: number) {
    super(at, 20, 4);
  }
}

/**
 * A socket's chat budget, within its message budget: a burst of 5, then one every 2 seconds. A
 * conversation never meets it; a message past it is refused (`chat-too-fast`) and the socket stays.
 */
export class ChatBudget extends TokenBucket {
  constructor(at: number) {
    super(at, 5, 0.5);
  }
}

/** A socket last heard from at `lastSeen` is gone by `now` (its network was lost, not closed). */
export const isSilent = (lastSeen: number, now: number): boolean => now - lastSeen > SILENCE_MS;

/** The client's address, as Cloudflare gives it (kept through the app's service binding). */
export const clientKey = (request: Request): string =>
  request.headers.get('cf-connecting-ip') ?? 'unknown';
