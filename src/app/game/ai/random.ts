/** A source of numbers in [0, 1), like `Math.random`, but reproducible from a seed. */
export type Random = () => number;

/**
 * The seed for one turn: the game's seed mixed with how far the game has gone, so the same game
 * seed does not start every turn from the same number. Seeds are integers (fractions would be
 * truncated), so a non-integer seed is refused.
 */
export function turnSeed(seed: number, revision: number): number {
  if (!Number.isInteger(seed)) {
    throw new Error(`An opponent seed must be an integer, got ${seed}`);
  }
  return (seed ^ Math.imul(revision + 1, 0x9e3779b1)) >>> 0;
}

/** Mulberry32: tiny, fast and good enough to vary an opponent's play; never for security. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks one item with probability proportional to its weight. Items weighing 0 are never picked. */
export function pickWeighted<T>(
  items: readonly T[],
  weight: (item: T) => number,
  random: Random,
): T {
  const weighted = items
    .map((item) => ({ item, weight: weight(item) }))
    .filter((entry) => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const last = weighted.at(-1);
  if (!last) {
    throw new Error('pickWeighted needs at least one item with a positive weight');
  }
  let roll = random() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll < 0) {
      return entry.item;
    }
  }
  // Rounding can leave the roll at the very end: the last item that can be picked.
  return last.item;
}
