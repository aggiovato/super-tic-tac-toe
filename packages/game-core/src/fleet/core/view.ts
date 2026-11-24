import type { Player } from '@tictac';
import { applyMove, initialState } from './engine';
import { type GameState, type Move, RULES_VERSION, type ReplayResult } from './models';

/**
 * A whole game's moves as `viewer` may see them: their own placement in full, the rival's only as
 * the fact that it happened (in full once the game is over), and every shot with what it did, a
 * sinking shot with the ship it sank. This is what the server sends each seat: nothing in it locates
 * a rival ship that still floats. The state must be a whole game (`viewer` null).
 */
export function redactMoves(state: GameState, viewer: Player): Move[] {
  if (state.viewer !== null) throw new Error('redactMoves: a view has nothing more to hide');
  const over = state.phase === 'over';
  const seen: Move[] = [];
  let walk = initialState();
  for (const move of state.moves) {
    const mover = walk.turn;
    const result = applyMove(walk, move);
    if (!result.ok) throw new Error(`redactMoves: an illegal move (${result.reason})`);
    walk = result.state;
    if (move.kind === 'place') {
      const shown = move.player === viewer || over;
      seen.push(shown ? move : { kind: 'place', player: move.player });
    } else {
      // The shot just fired is the last of the mover's.
      const { row, col, outcome, sunk } = walk.shots[mover].at(-1)!;
      // A whole game resolves every shot at once: nothing is pending here.
      const done = outcome as Exclude<typeof outcome, 'pending'>;
      seen.push(
        sunk
          ? { kind: 'shot', row, col, outcome: done, sunk }
          : { kind: 'shot', row, col, outcome: done },
      );
    }
  }
  return seen;
}

/**
 * Rebuilds `viewer`'s view (a `GameState` with `viewer` set) from the moves they were sent
 * (`redactMoves`), and any moves of their own still on their way: a shot without an outcome is
 * pending. Stops at the first move no game could produce.
 */
export function replayView(
  moves: readonly Move[],
  rulesVersion: number,
  viewer: Player,
): ReplayResult {
  if (rulesVersion !== RULES_VERSION) {
    return { ok: false, reason: 'unsupported-rules-version' };
  }
  let state = initialState(viewer);
  for (const [index, move] of moves.entries()) {
    const result = applyMove(state, move);
    if (!result.ok) {
      return { ok: false, reason: result.reason, index, state };
    }
    state = result.state;
  }
  return { ok: true, state };
}

/** What `viewer` knows of a whole game: the view rebuilt from the moves they may see. */
export function viewOf(state: GameState, viewer: Player): GameState {
  const result = replayView(redactMoves(state, viewer), state.rulesVersion, viewer);
  if (!result.ok) throw new Error(`viewOf: ${result.reason}`);
  return result.state;
}
