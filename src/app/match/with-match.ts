import { computed, inject } from '@angular/core';
import {
  signalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import type { Player } from '@tictac';
import { GameSession } from './game-session';
import type { Level, MatchGame, MatchRules, MatchState, Mode, Participant } from './match.model';
import { MATCH_STORAGE, matchStorage } from './match-storage';
import { matchTurns, newId, newSeed, other } from './match-turns';
import { Opponent } from './opponent';

/** Against the computer, participant 0 is the person and participant 1 the opponent. */
const OPPONENT: Participant = 1;

/**
 * A match of a turn-based game for two: the position, the series score, symbols that swap on every
 * rematch, undo, two people or the computer at a level, and the opponent's turn. The route provides
 * the game's `GameSession` and `Opponent`; `rules` gives the engine calls the match makes itself.
 */
export function withMatch<S extends MatchGame<M>, M, R>(rules: MatchRules<S, M>) {
  return signalStoreFeature(
    withMatchPlay<S, M, R>(rules),
    // Saving every change and restoring the saved match, where the route provides storage.
    withMethods((store) => matchStorage<S, M, R>(store, rules)),
    withHooks({ onInit: (store) => store._startStorage() }),
  );
}

/** The match without storage: position, series, symbols, undo and the opponent's turn. */
function withMatchPlay<S extends MatchGame<M>, M, R>(rules: MatchRules<S, M>) {
  return signalStoreFeature(
    withProps(() => ({
      _session: inject(GameSession) as GameSession<S, M, R>,
      _opponent: inject(Opponent) as Opponent<M>,
    })),
    withState<MatchState<S, R>>(() => ({
      game: (inject(GameSession) as GameSession<S, M, R>).start(),
      id: newId(),
      seriesId: newId(),
      startedAt: Date.now(),
      // With storage, the board waits for the saved match to be restored.
      ready: !inject(MATCH_STORAGE, { optional: true }),
      saveStatus: 'idle',
      seed: newSeed(),
      mode: 'humans',
      level: 'beginner',
      thinking: false,
      opponentMoves: 0,
      lastRejection: null,
      xPlayer: 0,
      wins: [0, 0],
      draws: 0,
      scored: false,
    })),
    // NgRx widens a generic state slice to its constraint: `position` reads the game back as S.
    withComputed(({ game }) => ({ position: computed(() => game() as S) })),
    withComputed(({ game, xPlayer, mode }) => {
      const toMove = computed((): Participant =>
        game().turn === 'X' ? xPlayer() : other(xPlayer()),
      );
      const isOver = computed(() => game().status.kind !== 'in-progress');
      /** The computer moves now: the person cannot play. */
      const opponentTurn = computed(
        () => mode() === 'opponent' && !isOver() && toMove() === OPPONENT,
      );
      return { toMove, isOver, opponentTurn };
    }),
    withComputed(({ game, position, opponentTurn, isOver, mode, wins, draws, ready }) => {
      // The person has no legal move while the opponent plays or the saved match loads.
      const legal = computed((): readonly M[] =>
        opponentTurn() || !ready() ? [] : rules.legalMoves(position()),
      );
      /** Moves one undo takes back: against the computer, back to the person's turn. */
      const undoSteps = computed(() => (mode() === 'opponent' && !opponentTurn() ? 2 : 1));
      return {
        legal,
        lastMove: computed((): M | null => game().moves.at(-1) ?? null),
        undoSteps,
        canUndo: computed(() => !isOver() && game().moves.length >= undoSteps()),
        /** Something a mode change would throw away: a score or a game under way. */
        seriesStarted: computed(
          () => game().moves.length > 0 || wins()[0] + wins()[1] + draws() > 0,
        ),
      };
    }),
    withMethods((store) => ({
      symbolOf(participant: Participant): Player {
        return participant === store.xPlayer() ? 'X' : 'O';
      },

      isLegal(move: M): boolean {
        return store.legal().some((legal) => rules.sameMove(legal, move));
      },
    })),
    // The match's machinery: accepting positions, scoring once and the opponent's turn.
    withMethods((store) => matchTurns<S, M, R>(store, rules)),
    // Leaving the route: a reply still on its way must not land in a store that is gone.
    withHooks({ onDestroy: (store) => store._stopOpponent() }),
    // What the player does.
    withMethods((store) => ({
      /** Next game of the series: symbols swapped. */
      rematch(): void {
        store._startGame({ xPlayer: other(store.xPlayer()) });
      },

      newSeries(): void {
        store._startGame({ seriesId: newId(), xPlayer: 0, wins: [0, 0], draws: 0 });
      },

      /** Two people or against the computer at `level`: a new series either way. */
      setMode(mode: Mode, level: Level): void {
        store._startGame({ seriesId: newId(), mode, level, xPlayer: 0, wins: [0, 0], draws: 0 });
      },
    })),
  );
}
