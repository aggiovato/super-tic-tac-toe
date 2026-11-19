import { describe, expect, it } from 'vitest';
import { createRandom, pickWeighted, turnSeed } from './random';

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
  });

  it('gives a different sequence for another seed', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it('stays within [0, 1)', () => {
    const random = createRandom(7);
    const values = Array.from({ length: 10_000 }, random);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});

describe('pickWeighted', () => {
  it('picks items in proportion to their weight', () => {
    const random = createRandom(3);
    const counts = { a: 0, b: 0, c: 0 };
    const weights = { a: 1, b: 2, c: 3 };
    for (let i = 0; i < 6000; i++) {
      counts[pickWeighted(['a', 'b', 'c'] as const, (item) => weights[item], random)] += 1;
    }
    expect(counts.a / 1000).toBeCloseTo(1, 0);
    expect(counts.b / 1000).toBeCloseTo(2, 0);
    expect(counts.c / 1000).toBeCloseTo(3, 0);
  });

  it('never picks an item that weighs nothing, even when the roll lands at the end', () => {
    const almostOne = () => 0.999_999_999;
    expect(pickWeighted(['a', 'b', 'c'], (item) => (item === 'c' ? 0 : 1), almostOne)).toBe('b');
    expect(pickWeighted(['a', 'b'], (item) => (item === 'a' ? 1 : 0), createRandom(9))).toBe('a');
  });

  it('falls back to the last pickable item when the roll reaches the very end', () => {
    // A roll equal to the total (rounding at the top of the range) still lands on an item.
    expect(
      pickWeighted(
        ['a', 'b', 'c'],
        (item) => (item === 'c' ? 0 : 1),
        () => 1,
      ),
    ).toBe('b');
  });

  it('refuses to pick from nothing', () => {
    expect(() => pickWeighted([], () => 1, createRandom(1))).toThrow();
    expect(() => pickWeighted(['a'], () => 0, createRandom(1))).toThrow();
  });
});

describe('turnSeed', () => {
  it('is the same for the same game seed and revision', () => {
    expect(turnSeed(42, 7)).toBe(turnSeed(42, 7));
  });

  it('changes with every revision, so a game does not reuse one roll each turn', () => {
    const seeds = new Set(Array.from({ length: 81 }, (_, revision) => turnSeed(42, revision)));
    expect(seeds.size).toBe(81);
    const firstRolls = new Set([...seeds].map((seed) => createRandom(seed)()));
    expect(firstRolls.size).toBe(81);
  });

  it('accepts any integer, negative included, and refuses fractions', () => {
    expect(turnSeed(-5, 0)).toBeGreaterThanOrEqual(0);
    expect(() => turnSeed(0.37, 0)).toThrow(/integer/);
  });
});
