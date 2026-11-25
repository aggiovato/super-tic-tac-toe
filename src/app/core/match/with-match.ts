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
import type { MatchGame, GameRules, MatchState, Participant } from './match.model';
import { MATCH_STORAGE, matchStorage } from './match-storage';
import { matchCommands } from './match-commands';
import { matchTurns, newId, newSeed, other } from './match-turns';
import { ComputerPlayer } from './computer';
import { matchRemote } from './match-remote';
import { RemoteSeat } from './remote-seat';

/**
 * Moves one undo takes back against the computer: back to the person's last turn, however many
 * moves that is (a game with extra turns may need more than two). Zero when there is none.
 */
function stepsToPerson<S extends MatchGame<M>, M>(
  rules: GameRules<S, M>,
  { moves, rulesVersion }: S,
  xPlayer: Participant,
  variant: string,
): number {
  const person = xPlayer === 0 ? 'X' : 'O';
  // One pass forward: whose turn it was after each prefix of the moves.
  const start = rules.replay([], rulesVersion, variant);
  if (!start.ok || !start.state) {
    return 0;
  }
  const turns = [start.state.turn];
  let state = start.state;
  for (const move of moves) {
    const next = rules.apply(state, move);
    if (!next.ok) {
      return 0;
    }
    state = next.state;
    turns.push(state.turn);
  }
  for (let steps = 1; steps <= moves.length; steps++) {
    if (turns[moves.length - steps] === person) {
      return steps;
    }
  }
  return 0;
}

/** Against the computer, participant 0 is the person and participant 1 the opponent. */
const PERSON: Participant = 0;
const COMPUTER: Participant = 1;

/**
 * A match of a turn-based game for two: the position, the series score, symbols that swap on every
 * rematch, undo, two people or the computer at a level, and the opponent's turn. The route provides
 * the game's `GameSession` and `ComputerPlayer`; `rules` gives the engine calls the match makes itself.
 */
export function withMatch<S extends MatchGame<M>, M, R>(rules: GameRules<S, M>) {
  return signalStoreFeature(
    withMatchPlay<S, M, R>(rules),
    // Saving every change and restoring the saved match, where the route provides storage.
    withMethods((store) => matchStorage<S, M, R>(store, rules)),
    withHooks({
      onInit: (store) => {
        store._startStorage();
        store._watchRemote();
      },
    }),
  );
}

/** A new match, in the route's injection context: local unless the route is online. */
function initialMatch<S, M, R>(): MatchState<S, R> {
  const remote = inject(RemoteSeat, { optional: true });
  return {
    game: (inject(GameSession) as GameSession<S, M, R>).start(''),
    variant: '',
    id: newId(),
    seriesId: newId(),
    startedAt: Date.now(),
    // With storage, the board waits for the saved match to be restored; online, for the room.
    ready: !inject(MATCH_STORAGE, { optional: true }) && !remote,
    saveStatus: 'idle',
    seed: newSeed(),
    mode: remote ? 'online' : 'local',
    level: 'beginner',
    thinking: false,
    computerMoves: 0,
    lastRejection: null,
    xPlayer: 0,
    wins: [0, 0],
    draws: 0,
    scored: false,
    seat: null,
    awaitingRival: false,
  };
}

/** The match without storage: position, series, symbols, undo and the opponent's turn. */
function withMatchPlay<S extends MatchGame<M>, M, R>(rules: GameRules<S, M>) {
  return signalStoreFeature(
    withProps(() => ({
      _session: inject(GameSession) as GameSession<S, M, R>,
      _computer: inject(ComputerPlayer) as ComputerPlayer<M>,
      // Online, the other player: the match mirrors the room instead of playing on its own.
      _remote: inject(RemoteSeat, { optional: true }),
    })),
    withState<MatchState<S, R>>(() => initialMatch<S, M, R>()),
    // NgRx widens a generic state slice to its constraint: `position` reads the game back as S.
    withComputed(({ game }) => ({ position: computed(() => game() as S) })),
    withComputed(({ game, position, xPlayer, mode, seat, awaitingRival }) => {
      const toMove = computed((): Participant =>
        game().turn === 'X' ? xPlayer() : other(xPlayer()),
      );
      const isOver = computed(() => game().status.kind !== 'in-progress');
      /**
       * Whether a participant may move now: the one to move, unless the game says more (both
       * place their fleets at once in Ship Sink).
       */
      const mayMove = (participant: Participant): boolean => {
        if (isOver()) return false;
        if (!rules.mayMove) return toMove() === participant;
        const symbol: Player = participant === xPlayer() ? 'X' : 'O';
        return rules.mayMove(position(), symbol);
      };
      /** The computer moves now (the person may too, where both move at once). */
      const computerTurn = computed(() => mode() === 'computer' && mayMove(COMPUTER));
      /**
       * Online, this device cannot play: the other player's turn, a move awaited, or the other
       * player not in the room yet.
       */
      const remoteTurn = computed(() => {
        const own = seat();
        return (
          mode() === 'online' && !isOver() && (awaitingRival() || own === null || !mayMove(own))
        );
      });
      /** The person (or, between two people, whoever is to move) may play now. */
      const personTurn = computed(() => {
        if (mode() === 'computer') return mayMove(PERSON);
        if (mode() === 'online') return !remoteTurn() && !isOver();
        return !isOver();
      });
      return { toMove, isOver, computerTurn, remoteTurn, personTurn };
    }),
    withComputed(
      ({ game, position, personTurn, isOver, mode, wins, draws, ready, xPlayer, variant }) => {
        // The person has no legal move while the opponent plays or the saved match loads.
        const legal = computed((): readonly M[] =>
          personTurn() && ready() ? rules.legalMoves(position()) : [],
        );
        // Moves one undo takes back: one between two people, back to the person's turn otherwise.
        const undoSteps = computed(() =>
          mode() === 'computer'
            ? stepsToPerson(rules, position(), xPlayer(), variant())
            : Math.min(1, position().moves.length),
        );
        return {
          legal,
          lastMove: computed((): M | null => game().moves.at(-1) ?? null),
          undoSteps,
          // Online, a move sent is the other player's to see: it is not taken back. Hidden
          // information has no undo either: taking back a miss would peek at the rival's waters.
          canUndo: computed(
            () => mode() !== 'online' && !rules.hidden && !isOver() && undoSteps() > 0,
          ),
          /** Something a mode change would throw away: a score or a game under way. */
          seriesStarted: computed(
            () => game().moves.length > 0 || wins()[0] + wins()[1] + draws() > 0,
          ),
        };
      },
    ),
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
    withMethods((store) => matchRemote<S, M, R>(store, rules)),
    // Leaving the route: a reply still on its way must not land in a store that is gone.
    withHooks({ onDestroy: (store) => store._stopComputer() }),
    // What the player does; ignored until the saved match is back (`ready`).
    withMethods((store) => matchCommands<S, M, R>(store, rules)),
  );
}
