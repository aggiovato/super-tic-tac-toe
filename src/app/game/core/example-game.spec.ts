import { describe, expect, it } from 'vitest';
import { GLOBAL_DIAGONAL_WIN } from './testing/fixtures';
import { formatState, play } from './testing/notation';

// A complete game a reviewer can follow without Angular: `npm run test:core` replays it and the
// snapshot shows the final position.
describe('example game', () => {
  it('ends with X winning the 0-4-8 diagonal', () => {
    expect(formatState(play(GLOBAL_DIAGONAL_WIN))).toMatchInlineSnapshot(`
      "X . . | . . . | O . .
      X O . | . . . | . . .
      X . O | . . . | . X .
      ------+-------+------
      O . . | . . X | . . O
      . . . | . . X | . . .
      . . O | . . X | . . .
      ------+-------+------
      O . . | O . . | X . .
      . O . | . . . | X . .
      . . . | . . . | X . .

      boards 0:X 1:_ 2:_ 3:_ 4:X 5:_ 6:_ 7:_ 8:X
      target game-over
      turn O
      status X wins"
    `);
  });
});
