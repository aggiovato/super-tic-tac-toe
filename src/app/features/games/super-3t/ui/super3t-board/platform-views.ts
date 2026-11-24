import type { BoardStatus } from '@super3t/core';
import { globalIndex, glyphOf, gridStrike, INDICES } from './board-geometry';
import type { PlatformInput } from './board.model';
import type { Messages } from '@i18n';
import type { PlatformView } from '../board-platform/platform-view.model';

/** The large mark over a board: its winner, `=` for a draw, nothing while it is open. */
export const closingOf = (status: BoardStatus | undefined): PlatformView['closing'] => {
  switch (status?.kind) {
    case 'won':
      return status.winner;
    case 'drawn':
      return '=';
    default:
      return null;
  }
};

/** A board's accessible name, which says how it closed. */
export const boardLabel = (t: Messages, board: number, status: BoardStatus | undefined): string => {
  switch (status?.kind) {
    case 'won':
      return t.closedWon(board + 1, status.winner);
    case 'drawn':
      return t.closedDrawn(board + 1);
    default:
      return t.board(board + 1);
  }
};

/** Every platform's view: its number, state, large mark, strike line and cells. */
export function platformViews(input: PlatformInput): readonly PlatformView[] {
  const { game, t, mode, legal, last, playable, previewTarget, freshBoard, motion } = input;
  const { status, target } = game;
  return INDICES.map((board) => {
    const boardStatus = game.boards[board];
    const forced = target.kind === 'forced' && target.board === board;
    const closing = closingOf(boardStatus);
    const fresh = closing !== null && freshBoard === board;
    const win = status.kind === 'won' && status.line.includes(board);
    return {
      board,
      number: String(board + 1),
      label: boardLabel(t, board, boardStatus),
      forced,
      freePick: target.kind === 'free' && playable.has(board),
      playable: playable.has(board),
      closed: boardStatus?.kind !== 'open',
      preview: previewTarget === board,
      win,
      winSpark: motion && win,
      spin: forced ? game.revision : 0,
      closing,
      fresh,
      spark: motion && fresh,
      strike: boardStatus?.kind === 'won' ? gridStrike(boardStatus.line) : null,
      cells: INDICES.map((cell) => {
        const mark = game.cells[board]?.[cell] ?? null;
        return {
          cell,
          mark,
          glyph: glyphOf(mark),
          legal: legal.has(board * 9 + cell),
          last: last?.board === board && last.cell === cell,
          label: t.cell(board + 1, cell + 1, mark),
          roving: mode === 'zoom' ? cell : globalIndex(board, cell),
        };
      }),
    };
  });
}
