import { LINES, type GameState, type Player } from '@core';

/**
 * Indices that would complete a line for `player`: the line's other two belong to `player` and this
 * one is still free. Works on both levels: the cells of a board, or the boards of the game.
 */
export function completions(
  owners: readonly (Player | null)[],
  player: Player,
  free: (index: number) => boolean,
): number[] {
  const found = new Set<number>();
  for (const line of LINES) {
    const open = line.filter((index) => owners[index] !== player);
    const [last] = open;
    if (open.length === 1 && last !== undefined && free(last)) {
      found.add(last);
    }
  }
  return [...found];
}

/** Cells of `board` where `player` would win that board. */
export function cellThreats(state: GameState, board: number, player: Player): number[] {
  const cells = state.cells[board] ?? [];
  return completions(cells, player, (cell) => cells[cell] === null);
}

/** Open boards that would win `player` the game: two boards of a line are theirs already. */
export function boardThreats(state: GameState, player: Player): number[] {
  const owners = state.boards.map((board) => (board.kind === 'won' ? board.winner : null));
  return completions(owners, player, (board) => state.boards[board]?.kind === 'open');
}
