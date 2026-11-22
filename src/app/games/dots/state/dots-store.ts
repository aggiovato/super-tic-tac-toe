import { computed } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';
import { type GameState, type Move, type Player, type RejectionReason, replay } from '@dots/core';
import { DOTS_GAME } from '@catalog';
import { withMatch } from '@match';

/** Dots and Boxes' store: a match, plus the boxes each player holds in the current game. */
export const DotsStore = signalStore(
  withMatch<GameState, Move, RejectionReason>(DOTS_GAME.rules),
  withComputed(({ game, variant }) => ({
    /** Boxes closed by X and by O in the game on the board. */
    boxes: computed(() => game().score),
    /** The board's size, from the game itself. */
    size: computed(() => game().size),
    /** Who drew the last line and how many boxes it closed; null before the first line. */
    lastLine: computed((): { readonly mover: Player; readonly closed: number } | null => {
      const { moves, rulesVersion, score } = game();
      const before = replay(moves.slice(0, -1), rulesVersion, variant());
      if (moves.length === 0 || !before.ok) {
        return null;
      }
      const mover = before.state.turn;
      return { mover, closed: score[mover] - before.state.score[mover] };
    }),
  })),
);

export type DotsStore = InstanceType<typeof DotsStore>;
