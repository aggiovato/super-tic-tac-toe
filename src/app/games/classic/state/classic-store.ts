import { signalStore } from '@ngrx/signals';
import { legalMoves, replay, type GameState, type Move, type RejectionReason } from '@classic/core';
import { withMatch } from '@match';

const sameMove = (a: Move, b: Move): boolean => a.cell === b.cell;

/** The classic game's store: a match and nothing else; the board has no views of its own. */
export const ClassicStore = signalStore(
  withMatch<GameState, Move, RejectionReason>({ legalMoves, replay, sameMove }),
);

export type ClassicStore = InstanceType<typeof ClassicStore>;
