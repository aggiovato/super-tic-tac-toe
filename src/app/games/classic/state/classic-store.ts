import { signalStore } from '@ngrx/signals';
import { type GameState, type Move, type RejectionReason } from '@classic/core';
import { CLASSIC_GAME } from '@catalog';
import { withMatch } from '@match';

/** The classic game's store: a match and nothing else; the board has no views of its own. */
export const ClassicStore = signalStore(
  withMatch<GameState, Move, RejectionReason>(CLASSIC_GAME.rules),
);

export type ClassicStore = InstanceType<typeof ClassicStore>;
