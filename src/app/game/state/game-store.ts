import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
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
import { GameSession, Opponent, type Level } from '@session';
import type { Mode, Participant, View } from './view.model';

interface GameStoreState {
  readonly game: GameState;
  /** Integer seed of the opponent's choices for this game. */
  readonly seed: number;
  readonly mode: Mode;
  readonly level: Level;
  /** The opponent is working on its reply; the player cannot move meanwhile. */
  readonly thinking: boolean;
  /** Opponent moves applied so far; the board watches it to follow the reply. */
  readonly opponentMoves: number;
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
/** Against the computer, participant 0 is the person and participant 1 the opponent. */
const OPPONENT: Participant = 1;

const sameMove = (a: Move, b: Move): boolean => a.board === b.board && a.cell === b.cell;
const newSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

export const GameStore = signalStore(
  withProps(() => ({ _session: inject(GameSession), _opponent: inject(Opponent) })),
  withState<GameStoreState>(() => ({
    game: inject(GameSession).start(),
    seed: newSeed(),
    mode: 'humans',
    level: 'beginner',
    thinking: false,
    opponentMoves: 0,
    view: GLOBAL,
    preview: null,
    lastRejection: null,
    xPlayer: 0,
    wins: [0, 0],
    draws: 0,
    scored: false,
  })),
  withComputed(({ game, xPlayer, mode }) => {
    const toMove = computed((): Participant =>
      game().turn === 'X' ? xPlayer() : xPlayer() === 0 ? 1 : 0,
    );
    const isOver = computed(() => game().status.kind !== 'in-progress');
    /** The computer moves now: the person cannot play. */
    const opponentTurn = computed(
      () => mode() === 'opponent' && !isOver() && toMove() === OPPONENT,
    );
    return { toMove, isOver, opponentTurn };
  }),
  withComputed(({ game, preview, opponentTurn, isOver, mode, wins, draws }) => {
    // The person has no legal move while the opponent plays.
    const legal = computed(() => (opponentTurn() ? [] : legalMoves(game())));
    /** Moves one undo takes back: against the computer, back to the person's turn. */
    const undoSteps = computed(() => (mode() === 'opponent' && !opponentTurn() ? 2 : 1));
    return {
      legal,
      playableBoards: computed(() => new Set(legal().map((move) => move.board))),
      lastMove: computed(() => game().moves.at(-1) ?? null),
      undoSteps,
      canUndo: computed(() => !isOver() && game().moves.length >= undoSteps()),
      /** Something a mode change would throw away: a score or a game under way. */
      seriesStarted: computed(() => game().moves.length > 0 || wins()[0] + wins()[1] + draws() > 0),
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
  // The view: what the player looks at; it never changes the game.
  withMethods((store) => ({
    symbolOf(participant: Participant): Player {
      return participant === store.xPlayer() ? 'X' : 'O';
    },

    isLegal(move: Move): boolean {
      return store.legal().some((legal) => sameMove(legal, move));
    },

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
  // The game's machinery: accepting positions, scoring once and the opponent's turn.
  withMethods((store) => {
    /** Publishes an accepted position and counts its result once. */
    const accept = (game: GameState): void => {
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
    };

    /**
     * Applies the opponent's reply, revalidated by the engine: an illegal one plays a legal move
     * instead. A null reply passes (nothing to play, or a challenge it no longer defends): the
     * opponent's turn stays, so the board takes no moves.
     */
    const applyReply = (move: Move | null): void => {
      patchState(store, { thinking: false });
      const game = store.game();
      let result = move ? store._session.play(game, move) : null;
      if (move && !result?.ok) {
        const fallback = legalMoves(game)[0];
        result = fallback ? store._session.play(game, fallback) : null;
      }
      if (result?.ok) {
        accept(result.state);
        patchState(store, { opponentMoves: store.opponentMoves() + 1 });
      }
    };

    /** Asks for the opponent's move when it is its turn; replies to another position are dropped. */
    /**
     * The request whose reply still counts. Every request and every stop moves it on, so a reply to
     * anything older (cancelled, or asked before an undo and a replay reached the same revision) is
     * dropped, never played.
     */
    let ticket = 0;

    const requestOpponent = (): void => {
      if (!store.opponentTurn() || store.thinking()) {
        return;
      }
      const asked = ++ticket;
      patchState(store, { thinking: true });
      store._opponent
        .reply({ moves: store.game().moves, level: store.level(), seed: store.seed() })
        .then(
          (move) => {
            if (asked === ticket) {
              applyReply(move);
            }
          },
          (error: unknown) => {
            if (asked === ticket) {
              console.error('The opponent failed; playing a legal move instead.', error);
              applyReply(legalMoves(store.game())[0] ?? null);
            }
          },
        );
    };

    /** Stops the opponent's turn in flight. */
    const stopOpponent = (): void => {
      ticket += 1;
      if (store.thinking()) {
        store._opponent.cancel();
        patchState(store, { thinking: false });
      }
    };

    /** A new game: a new seed, then the opponent opens if it plays X. */
    const startGame = (changes: Partial<GameStoreState>): void => {
      stopOpponent();
      patchState(store, {
        ...changes,
        game: store._session.start(),
        seed: newSeed(),
        view: GLOBAL,
        preview: null,
        lastRejection: null,
        scored: false,
      });
      requestOpponent();
    };

    return {
      _accept: accept,
      _requestOpponent: requestOpponent,
      _stopOpponent: stopOpponent,
      _startGame: startGame,
    };
  }),
  // Leaving the route: a reply still on its way must not land in a store that is gone.
  withHooks({ onDestroy: (store) => store._stopOpponent() }),
  // What the player does.
  withMethods((store) => ({
    play(move: Move): void {
      if (store.opponentTurn()) {
        return;
      }
      const result = store._session.play(store.game(), move);
      if (!result.ok) {
        patchState(store, { lastRejection: result.reason });
        return;
      }
      store._accept(result.state);
      store._requestOpponent();
    },

    /** Takes back the last move while the game goes on; against the computer, its reply too. */
    undo(): void {
      if (!store.canUndo()) {
        return;
      }
      const steps = store.undoSteps();
      store._stopOpponent();
      const moves = store.game().moves;
      const result = replay(moves.slice(0, moves.length - steps), store.game().rulesVersion);
      if (result.ok) {
        patchState(store, {
          game: result.state,
          view: GLOBAL,
          preview: null,
          lastRejection: null,
        });
      }
    },

    /** Next game of the series: symbols swapped. */
    rematch(): void {
      store._startGame({ xPlayer: store.xPlayer() === 0 ? 1 : 0 });
    },

    newSeries(): void {
      store._startGame({ xPlayer: 0, wins: [0, 0], draws: 0 });
    },

    /** Two people or against the computer at `level`: a new series either way. */
    setMode(mode: Mode, level: Level): void {
      store._startGame({ mode, level, xPlayer: 0, wins: [0, 0], draws: 0 });
    },
  })),
);

export type GameStore = InstanceType<typeof GameStore>;
