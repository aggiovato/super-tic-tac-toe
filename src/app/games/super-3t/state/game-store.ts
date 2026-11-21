import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withLinkedState, withMethods } from '@ngrx/signals';
import { withMatch } from '@match';
import {
  applyMove,
  legalMoves,
  replay,
  type GameState,
  type Move,
  type RejectionReason,
} from '@super3t/core';
import type { View } from './view.model';

const GLOBAL: View = { kind: 'global' };

const sameMove = (a: Move, b: Move): boolean => a.board === b.board && a.cell === b.cell;

/**
 * Super 3T's store: a match (`withMatch`: series, symbols, undo, the opponent's turn) plus what only
 * this game has, the open board and the departure preview.
 */
export const GameStore = signalStore(
  withMatch<GameState, Move, RejectionReason>({ legalMoves, replay, sameMove }),
  // Every new position (a move, a reply, an undo, a new game) starts on the whole board, with no
  // preview; the UI decides whether to open the next board.
  withLinkedState(({ game }) => ({
    view: (): View => (game(), GLOBAL),
    /** Legal cell under the pointer or focus, used to preview its departure. */
    preview: (): Move | null => (game(), null),
  })),
  withComputed(({ game, legal, preview }) => ({
    playableBoards: computed(() => new Set(legal().map((move) => move.board))),
    /**
     * Where the opponent would go if the previewed cell were played: a board number, null for a
     * free choice, undefined when there is no preview or the move would end the game.
     */
    previewTarget: computed((): number | null | undefined => {
      const move = preview();
      if (!move) {
        return undefined;
      }
      const result = applyMove(game(), move);
      if (!result.ok || result.state.target.kind === 'game-over') {
        return undefined;
      }
      return result.state.target.kind === 'forced' ? result.state.target.board : null;
    }),
  })),
  // The view: what the player looks at; it never changes the game.
  withMethods((store) => ({
    openBoard(board: number): void {
      if (store.playableBoards().has(board)) {
        patchState(store, { view: { kind: 'board', board } });
      }
    },

    showGlobal(): void {
      patchState(store, { view: GLOBAL, preview: null });
    },

    setPreview(move: Move | null): void {
      patchState(store, { preview: move && store.isOver() ? null : move });
    },
  })),
);

export type GameStore = InstanceType<typeof GameStore>;
