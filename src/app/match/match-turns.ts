import type { Signal } from '@angular/core';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import type { GameSession } from './game-session';
import type { Level, MatchGame, MatchRules, MatchState, Participant } from './match.model';
import type { ComputerPlayer } from './computer';

/** What the match's machinery reads and writes on the store. */
export interface MatchTurnsStore<S, M, R> extends WritableStateSource<MatchState<S, R>> {
  readonly _session: GameSession<S, M, R>;
  readonly _computer: ComputerPlayer<M>;
  readonly position: Signal<S>;
  readonly computerTurn: Signal<boolean>;
  readonly thinking: Signal<boolean>;
  readonly computerMoves: Signal<number>;
  readonly scored: Signal<boolean>;
  readonly draws: Signal<number>;
  readonly wins: Signal<readonly [number, number]>;
  readonly xPlayer: Signal<Participant>;
  readonly level: Signal<Level>;
  readonly seed: Signal<number>;
  readonly variant: Signal<string>;
  readonly canUndo: Signal<boolean>;
  readonly undoSteps: Signal<number>;
  /** The saved match is back: until then the player's commands are ignored. */
  readonly ready: Signal<boolean>;
}

export const other = (participant: Participant): Participant => (participant === 0 ? 1 : 0);
export const newSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
export const newId = (): string => crypto.randomUUID();

/** Publishes an accepted position and counts its result once. */
function acceptPosition<S extends MatchGame<M>, M, R>(
  store: MatchTurnsStore<S, M, R>,
  game: S,
): void {
  patchState(store, { game, lastRejection: null });
  if (game.status.kind === 'in-progress' || store.scored()) {
    return;
  }
  if (game.status.kind === 'drawn') {
    patchState(store, { draws: store.draws() + 1, scored: true });
    return;
  }
  const winner = game.status.winner === 'X' ? store.xPlayer() : other(store.xPlayer());
  const wins: [number, number] = [...store.wins()];
  wins[winner] += 1;
  patchState(store, { wins, scored: true });
}

/**
 * Applies the opponent's reply, revalidated by the engine: an illegal one plays a legal move
 * instead. A null reply passes (nothing to play, or a challenge it no longer defends): the
 * opponent's turn stays, so the board takes no moves.
 */
function applyComputerMove<S extends MatchGame<M>, M, R>(
  store: MatchTurnsStore<S, M, R>,
  rules: MatchRules<S, M>,
  move: M | null,
): void {
  patchState(store, { thinking: false });
  const game = store.position();
  let result = move === null ? null : store._session.play(game, move);
  if (move !== null && !result?.ok) {
    const fallback = rules.legalMoves(game)[0];
    result = fallback === undefined ? null : store._session.play(game, fallback);
  }
  if (result?.ok) {
    acceptPosition(store, result.state);
    patchState(store, { computerMoves: store.computerMoves() + 1 });
  }
}

/** Replays the game without its last `undoSteps` moves. */
export function takeBack<S extends MatchGame<M>, M, R>(
  store: MatchTurnsStore<S, M, R>,
  rules: MatchRules<S, M>,
): void {
  const { moves, rulesVersion } = store.position();
  const result = rules.replay(
    moves.slice(0, moves.length - store.undoSteps()),
    rulesVersion,
    store.variant(),
  );
  if (result.ok && result.state) {
    patchState(store, { game: result.state, lastRejection: null });
  }
}

/**
 * The match's machinery: accepting positions and scoring each game once, the opponent's turn with
 * its ticket, and starting a new game.
 */
export function matchTurns<S extends MatchGame<M>, M, R>(
  store: MatchTurnsStore<S, M, R>,
  rules: MatchRules<S, M>,
) {
  const accept = (game: S): void => acceptPosition(store, game);

  // A game with extra turns (Dots and Boxes) may leave the opponent to move again: ask again.
  const applyReply = (move: M | null): void => {
    applyComputerMove(store, rules, move);
    if (move !== null) {
      requestComputer();
    }
  };

  /**
   * The request whose reply still counts. Every request and every stop moves it on, so a reply to
   * anything older (cancelled, or asked before an undo and a replay reached the same revision) is
   * dropped, never played.
   */
  let ticket = 0;

  /** Asks for the opponent's move when it is its turn. */
  const requestComputer = (): void => {
    if (!store.computerTurn() || store.thinking()) {
      return;
    }
    const asked = ++ticket;
    patchState(store, { thinking: true });
    store._computer
      .reply({
        moves: store.position().moves,
        level: store.level(),
        seed: store.seed(),
        variant: store.variant(),
      })
      .then(
        (move) => {
          if (asked === ticket) {
            applyReply(move);
          }
        },
        (error: unknown) => {
          if (asked === ticket) {
            console.error('The opponent failed; playing a legal move instead.', error);
            applyReply(rules.legalMoves(store.position())[0] ?? null);
          }
        },
      );
  };

  /** Stops the opponent's turn in flight. */
  const stopComputer = (): void => {
    ticket += 1;
    if (store.thinking()) {
      store._computer.cancel();
      patchState(store, { thinking: false });
    }
  };

  /** A new game: a new seed, then the opponent opens if it plays X. */
  const startGame = (changes: Partial<MatchState<S, R>>): void => {
    stopComputer();
    patchState(store, {
      ...changes,
      game: store._session.start(changes.variant ?? store.variant()),
      id: newId(),
      startedAt: Date.now(),
      seed: newSeed(),
      lastRejection: null,
      scored: false,
    });
    requestComputer();
  };

  return {
    _accept: accept,
    _requestComputer: requestComputer,
    _stopComputer: stopComputer,
    _startGame: startGame,
  };
}
