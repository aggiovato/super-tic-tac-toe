import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  applyMove,
  legalMoves,
  replay,
  type GameState,
  type Move,
  type Player,
  type RejectionReason,
} from '@core';
import { GameSession } from '@session';
import type { Participant, View } from './view.model';

interface GameStoreState {
  readonly game: GameState;
  readonly view: View;
  /** Legal cell under the pointer or focus, used to preview its departure. */
  readonly preview: Move | null;
  readonly lastRejection: RejectionReason | null;
  /** Participant playing X in the current game. X always starts. */
  readonly xPlayer: Participant;
  readonly wins: readonly [number, number];
  readonly draws: number;
  /** Whether the current game's result is already in the series score. */
  readonly scored: boolean;
}

const GLOBAL: View = { kind: 'global' };

const sameMove = (a: Move, b: Move): boolean => a.board === b.board && a.cell === b.cell;

export const GameStore = signalStore(
  withProps(() => ({ _session: inject(GameSession) })),
  withState<GameStoreState>(() => ({
    game: inject(GameSession).start(),
    view: GLOBAL,
    preview: null,
    lastRejection: null,
    xPlayer: 0,
    wins: [0, 0],
    draws: 0,
    scored: false,
  })),
  withComputed(({ game, xPlayer, preview }) => {
    const legal = computed(() => legalMoves(game()));
    return {
      legal,
      playableBoards: computed(() => new Set(legal().map((move) => move.board))),
      isOver: computed(() => game().status.kind !== 'in-progress'),
      lastMove: computed(() => game().moves.at(-1) ?? null),
      /** Participant whose turn it is. */
      toMove: computed((): Participant =>
        game().turn === 'X' ? xPlayer() : xPlayer() === 0 ? 1 : 0,
      ),
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
    };
  }),
  withMethods((store) => {
    const symbolOf = (participant: Participant): Player =>
      participant === store.xPlayer() ? 'X' : 'O';

    return {
      symbolOf,

      isLegal(move: Move): boolean {
        return store.legal().some((legal) => sameMove(legal, move));
      },

      play(move: Move): void {
        const result = store._session.play(store.game(), move);
        if (!result.ok) {
          patchState(store, { lastRejection: result.reason });
          return;
        }
        const game = result.state;
        // Every move ends on the whole board; the UI decides whether to open the next one.
        patchState(store, { game, preview: null, lastRejection: null, view: GLOBAL });
        if (game.status.kind === 'in-progress' || store.scored()) {
          return;
        }
        if (game.status.kind === 'drawn') {
          patchState(store, { draws: store.draws() + 1, scored: true });
          return;
        }
        const winner: Participant =
          game.status.winner === 'X' ? store.xPlayer() : store.xPlayer() === 0 ? 1 : 0;
        const wins: [number, number] = [...store.wins()];
        wins[winner] += 1;
        patchState(store, { wins, scored: true });
      },

      openBoard(board: number): void {
        if (store.playableBoards().has(board)) {
          patchState(store, { view: { kind: 'board', board } });
        }
      },

      showGlobal(): void {
        patchState(store, { view: GLOBAL, preview: null });
      },

      /** Takes back the last move while the game is still going. */
      undo(): void {
        const moves = store.game().moves;
        if (moves.length === 0 || store.isOver()) {
          return;
        }
        const result = replay(moves.slice(0, -1), store.game().rulesVersion);
        if (result.ok) {
          patchState(store, {
            game: result.state,
            view: GLOBAL,
            preview: null,
            lastRejection: null,
          });
        }
      },

      setPreview(move: Move | null): void {
        patchState(store, { preview: move && store.isOver() ? null : move });
      },

      /** Next game of the series: a new id and position, symbols swapped. */
      rematch(): void {
        patchState(store, {
          game: store._session.start(),
          xPlayer: store.xPlayer() === 0 ? 1 : 0,
          view: GLOBAL,
          preview: null,
          lastRejection: null,
          scored: false,
        });
      },

      newSeries(): void {
        patchState(store, {
          game: store._session.start(),
          xPlayer: 0,
          wins: [0, 0],
          draws: 0,
          view: GLOBAL,
          preview: null,
          lastRejection: null,
          scored: false,
        });
      },
    };
  }),
);

export type GameStore = InstanceType<typeof GameStore>;
