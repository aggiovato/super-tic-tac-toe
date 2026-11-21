import { applyMove, legalMoves, type GameState, type Move } from '@classic/core';
import {
  cellWeight,
  createRandom,
  pickWeighted,
  turnSeed,
  type Player,
  type Random,
} from '@tictac';

/** How strong the classic opponent plays, weakest first. */
export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

export interface OpponentOptions {
  readonly level: Level;
  /** Integer seed for the whole game; each turn mixes it with the revision. */
  readonly seed: number;
}

const after = (state: GameState, move: Move): GameState => {
  const result = applyMove(state, move);
  if (!result.ok) {
    throw new Error(`An opponent move was refused: ${result.reason}`);
  }
  return result.state;
};

/** Moves that win the game at once for `player` (as if it were to move). */
function winsFor(state: GameState, player: Player): Move[] {
  const asPlayer: GameState = { ...state, turn: player };
  return legalMoves(asPlayer).filter((move) => after(asPlayer, move).status.kind === 'won');
}

/** A seeded pick among `moves`, preferring the centre, then corners, then edges. */
const weighted = (moves: readonly Move[], random: Random): Move =>
  pickWeighted(moves, cellWeight, random);

/**
 * Value of `state` for the player to move with perfect play on both sides: positive wins (sooner is
 * higher), 0 draws, negative loses (later is higher). Memoised by position; the classic game has
 * a few thousand.
 */
function negamax(state: GameState, memo: Map<string, number>): number {
  if (state.status.kind === 'won') {
    // The previous move won: the player to move has lost; losing later is better.
    return -(10 - state.revision);
  }
  if (state.status.kind === 'drawn') {
    return 0;
  }
  const key = state.cells.map((mark) => mark ?? '.').join('');
  const known = memo.get(key);
  if (known !== undefined) {
    return known;
  }
  const value = Math.max(...legalMoves(state).map((move) => -negamax(after(state, move), memo)));
  memo.set(key, value);
  return value;
}

/** Every move that keeps the best value; perfect play picks among them. */
export function bestMoves(state: GameState): Move[] {
  const memo = new Map<string, number>();
  const scored = legalMoves(state).map((move) => ({
    move,
    value: -negamax(after(state, move), memo),
  }));
  const best = Math.max(...scored.map((entry) => entry.value));
  return scored.filter((entry) => entry.value === best).map((entry) => entry.move);
}

/**
 * The classic opponent's move for the player to move, or null once the game is over.
 * - beginner: wins in one move when it can, otherwise a weighted random move;
 * - intermediate: also blocks the opponent's winning cell;
 * - advanced: perfect play (it never loses), varied among equally good moves by the seed.
 */
export function chooseMove(state: GameState, { level, seed }: OpponentOptions): Move | null {
  const moves = legalMoves(state);
  if (moves.length === 0) {
    return null;
  }
  if (!LEVELS.includes(level)) {
    throw new Error(`Unknown level: ${String(level)}`);
  }
  const random = createRandom(turnSeed(seed, state.revision));
  if (level === 'advanced') {
    return weighted(bestMoves(state), random);
  }
  const win = winsFor(state, state.turn);
  if (win.length > 0) {
    return weighted(win, random);
  }
  const threats = level === 'intermediate' ? winsFor(state, state.turn === 'X' ? 'O' : 'X') : [];
  return weighted(threats.length > 0 ? threats : moves, random);
}
