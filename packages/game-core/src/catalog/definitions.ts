import * as classic from '@classic/core';
import * as dots from '@dots/core';
import * as fleet from '@fleet/core';
import * as super3t from '@super3t/core';
import type { GameDefinition } from './game-definition.model';
import { COMPUTER_LEVELS } from './levels';

/** Two people on one device by default, or the computer player. */
const BOTH_MODES = ['local', 'computer'] as const;

/** A game played in one shape: every value reads as the only variant. */
const ONE_SHAPE: Pick<GameDefinition, 'variants' | 'variantOf'> = {
  variants: [''],
  variantOf: () => '',
};

export const SUPER3T_GAME = {
  id: 'super-3t',
  rulesVersion: super3t.RULES_VERSION,
  ...ONE_SHAPE,
  modes: BOTH_MODES,
  draws: true,
  online: true,
  levels: COMPUTER_LEVELS,
  featured: true,
  rules: {
    legalMoves: super3t.legalMoves,
    replay: super3t.replay,
    sameMove: super3t.sameMove,
    apply: super3t.applyMove,
  },
} as const satisfies GameDefinition<'super-3t', super3t.Move, super3t.GameState>;

export const CLASSIC_GAME = {
  id: 'classic',
  rulesVersion: classic.RULES_VERSION,
  ...ONE_SHAPE,
  modes: BOTH_MODES,
  draws: true,
  online: true,
  levels: COMPUTER_LEVELS,
  featured: false,
  rules: {
    legalMoves: classic.legalMoves,
    replay: classic.replay,
    sameMove: classic.sameMove,
    apply: classic.applyMove,
  },
} as const satisfies GameDefinition<'classic', classic.Move, classic.GameState>;

export const DOTS_GAME = {
  id: 'dots',
  rulesVersion: dots.RULES_VERSION,
  // Board sizes; an empty or unknown size (older saves) is the default board.
  variants: dots.SIZES.map(dots.variantOf),
  variantOf: (raw: string | undefined) => dots.variantOf(dots.sizeOfVariant(raw ?? '')),
  modes: BOTH_MODES,
  draws: true,
  online: true,
  levels: COMPUTER_LEVELS,
  featured: false,
  rules: {
    legalMoves: dots.legalMoves,
    replay: dots.replay,
    sameMove: dots.sameMove,
    apply: dots.applyMove,
  },
} as const satisfies GameDefinition<'dots', dots.Move, dots.GameState>;

export const FLEET_GAME = {
  id: 'fleet',
  rulesVersion: fleet.RULES_VERSION,
  ...ONE_SHAPE,
  // Hidden fleets: never two people on one screen. Online once the server hides each seat's
  // rival fleet (phase 7e).
  modes: ['computer'],
  draws: false,
  online: false,
  levels: COMPUTER_LEVELS,
  featured: false,
  rules: {
    legalMoves: fleet.legalMoves,
    replay: fleet.replay,
    sameMove: fleet.sameMove,
    apply: fleet.applyMove,
    mayMove: fleet.mayMove,
    hidden: {
      redact: fleet.redactMoves,
      replayView: (moves, rulesVersion, _variant, viewer) =>
        fleet.replayView(moves, rulesVersion, viewer),
    },
  },
} as const satisfies GameDefinition<'fleet', fleet.Move, fleet.GameState>;

/** The games of the app, in the order the library lists them. */
export const GAMES = [SUPER3T_GAME, FLEET_GAME, DOTS_GAME, CLASSIC_GAME] as const;

/** A game of the app; each has its own route and its own way of playing. */
export type GameId = (typeof GAMES)[number]['id'];

export const GAME_IDS: readonly GameId[] = GAMES.map((game) => game.id);

/** A game's definition by id. */
export function gameById(id: GameId): GameDefinition<GameId> {
  const game = GAMES.find((candidate) => candidate.id === id);
  if (!game) {
    throw new Error(`Unknown game: ${String(id)}`);
  }
  return game;
}

/** Whether a stored value names a game of the app. */
export const isGameId = (value: unknown): value is GameId => GAME_IDS.some((id) => id === value);
