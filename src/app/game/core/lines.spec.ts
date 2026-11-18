import { describe, expect, it } from 'vitest';
import { findLine, LINES } from './lines';
import type { Player } from './types';

const ownersWith = (indices: readonly number[], player: Player): (Player | null)[] =>
  Array.from({ length: 9 }, (_, index) => (indices.includes(index) ? player : null));

describe('LINES', () => {
  it('lists the three rows, three columns and two diagonals exactly once', () => {
    expect(LINES).toHaveLength(8);
    expect(new Set(LINES.map((line) => line.join()))).toEqual(
      new Set(['0,1,2', '3,4,5', '6,7,8', '0,3,6', '1,4,7', '2,5,8', '0,4,8', '2,4,6']),
    );
  });
});

describe('findLine', () => {
  it.each(LINES.map((line) => [line.join('-'), line] as const))(
    'finds the %s line for its owner and not for the opponent',
    (_, line) => {
      const owners = ownersWith(line, 'O');
      expect(findLine(owners, 'O')).toEqual(line);
      expect(findLine(owners, 'X')).toBeNull();
    },
  );

  it('ignores two in a row and mixed lines', () => {
    const owners = ownersWith([0, 1], 'X');
    owners[2] = 'O';
    expect(findLine(owners, 'X')).toBeNull();
    expect(findLine(owners, 'O')).toBeNull();
  });
});
