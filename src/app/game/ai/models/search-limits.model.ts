import type { Move } from '@core';

/** What a level gets besides the position: a legal move to fall back on and a clock to watch. */
export interface SearchLimits {
  /** Prepared before the level thinks: it answers this when it runs out of time with nothing better. */
  readonly fallback: Move;
  /** True once the level's time budget is spent. */
  readonly expired: () => boolean;
}
