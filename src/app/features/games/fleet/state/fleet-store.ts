import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { FLEET_GAME } from '@catalog';
import {
  type GameState,
  type Move,
  other,
  type Player,
  type RejectionReason,
  BOARD_SIZE,
  type Shot,
  shotsInOrder,
  viewOf,
} from '@fleet/core';
import { type Participant, withMatch } from '@match';

/** The last shot fired in the game on the board, and who fired it. */
export interface LastShot {
  readonly by: Player;
  readonly shot: Shot;
}

/**
 * Ship Sink's store: a match, plus what this device's player may see of it. Against the computer
 * the match holds the whole game (the computer's fleet too, for saving and replaying) and the
 * board shows the person's view of it; online the match already holds this seat's view.
 */
export const FleetStore = signalStore(
  withMatch<GameState, Move, RejectionReason>(FLEET_GAME.rules),
  // The cell this device's player aims at (index row by row), before firing; and the game in which
  // they turned the big board to their own waters (the magnifier), forgotten with a new game.
  withState<{ aimedAt: number | null; lookingIn: string | null }>({
    aimedAt: null,
    lookingIn: null,
  }),
  withComputed(({ game, mode, seat, xPlayer }) => {
    /** The participant playing on this device: the person against the computer, or this seat. */
    const person = computed((): Participant => (mode() === 'online' ? (seat() ?? 0) : 0));
    const me = computed((): Player => (person() === xPlayer() ? 'X' : 'O'));
    const view = computed((): GameState => {
      const state = game();
      return state.viewer !== null ? state : viewOf(state, me());
    });
    return {
      person,
      me,
      rival: computed((): Player => other(me())),
      view,
      /** The last shot fired, by either player, and who fired it; null before the first. */
      lastShot: computed((): LastShot | null => shotsInOrder(view()).at(-1) ?? null),
    };
  }),
  withComputed(({ lookingIn, id }) => ({
    /** The big board shows this player's own waters (the magnifier) instead of the enemy's. */
    lookingAtOwn: computed(() => lookingIn() === id()),
  })),
  withComputed(({ aimedAt, view, me, personTurn, ready, lookingAtOwn }) => ({
    /**
     * The aimed cell while the player may fire there; null otherwise (a new turn clears it). Kept
     * while they look at their own waters, and back when they look at the enemy's again.
     */
    aimed: computed((): number | null => {
      const index = aimedAt();
      const state = view();
      if (index === null || !ready() || !personTurn() || state.phase !== 'firing') return null;
      if (lookingAtOwn()) return null;
      const fired = state.shots[me()].some((shot) => shot.row * BOARD_SIZE + shot.col === index);
      return fired ? null : index;
    }),
  })),
  withMethods((store) => ({
    /** Turns the big board to this player's own waters, or back to the enemy's. */
    look(own: boolean): void {
      patchState(store, { lookingIn: own ? store.id() : null });
    },

    /** Aims at a cell of the enemy waters (or nowhere). */
    aim(index: number | null): void {
      patchState(store, { aimedAt: index });
    },

    /** Fires at the aimed cell. */
    fire(): void {
      const index = store.aimed();
      if (index === null) return;
      patchState(store, { aimedAt: null });
      store.play({ kind: 'shot', row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE });
    },
  })),
);

export type FleetStore = InstanceType<typeof FleetStore>;
