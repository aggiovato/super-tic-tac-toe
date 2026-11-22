import type { Signal } from '@angular/core';
import { patchState } from '@ngrx/signals';
import type { Level, MatchGame, MatchRules, MatchState, Mode } from './match.model';
import { type MatchTurnsStore, newId, other, takeBack } from './match-turns';

/** What the player's commands read and call on the store. */
export interface MatchCommandsStore<S, M, R> extends MatchTurnsStore<S, M, R> {
  readonly _accept: (game: S) => void;
  readonly _requestOpponent: () => void;
  readonly _stopOpponent: () => void;
  readonly _startGame: (changes: Partial<MatchState<S, R>>) => void;
}

/**
 * What the player does: a move, undo, a rematch, a new series and who plays. Every command waits
 * for the saved match to be back (`ready`), so nothing is played on a position about to change.
 */
export function matchCommands<S extends MatchGame<M>, M, R>(
  store: MatchCommandsStore<S, M, R> & { readonly ready: Signal<boolean> },
  rules: MatchRules<S, M>,
) {
  const start = (changes: Partial<MatchState<S, R>>): void => {
    if (store.ready()) {
      store._startGame(changes);
    }
  };
  const newSeries = { seriesId: '', xPlayer: 0, wins: [0, 0], draws: 0 } as const;
  return {
    /** Refused moves are recorded; accepted ones may hand the turn over. */
    play(move: M): void {
      if (store.opponentTurn() || !store.ready()) {
        return;
      }
      const result = store._session.play(store.position(), move);
      if (!result.ok) {
        patchState(store, { lastRejection: result.reason });
        return;
      }
      store._accept(result.state);
      store._requestOpponent();
    },

    /** Takes back the last move while the game goes on; against the computer, back to your turn. */
    undo(): void {
      if (store.canUndo() && store.ready()) {
        store._stopOpponent();
        takeBack(store, rules);
      }
    },

    /** Next game of the series: symbols swapped. */
    rematch(): void {
      start({ xPlayer: other(store.xPlayer()) });
    },

    newSeries(): void {
      start({ ...newSeries, seriesId: newId() });
    },

    /** Two people or against the computer at `level`, and `variant` when given: a new series. */
    setMode(mode: Mode, level: Level, variant?: string): void {
      start({ ...newSeries, seriesId: newId(), mode, level, variant: variant ?? store.variant() });
    },
  };
}
