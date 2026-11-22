import { effect, type Signal, untracked } from '@angular/core';
import { patchState } from '@ngrx/signals';
import type { GameRules, MatchGame, Participant } from './match.model';
import { type MatchTurnsStore, other } from './match-turns';
import type { RemoteGame, RemoteSeat } from './remote-seat';

/** What mirroring an online game reads and writes on the store. */
export interface MatchRemoteStore<S, M, R> extends MatchTurnsStore<S, M, R> {
  readonly _remote: RemoteSeat | null;
  readonly id: Signal<string>;
}

/** The score with this game's result added when the server has not counted it yet. */
function scoreOf(remote: RemoteGame, game: MatchGame<unknown>): [[number, number], number] {
  const wins: [number, number] = [remote.wins[0], remote.wins[1]];
  const { status } = game;
  if (remote.scored || status.kind === 'in-progress') {
    return [wins, remote.draws];
  }
  if (status.kind === 'drawn') {
    return [wins, remote.draws + 1];
  }
  const winner: Participant = status.winner === 'X' ? remote.xPlayer : other(remote.xPlayer);
  wins[winner] += 1;
  return [wins, remote.draws];
}

/**
 * An online match mirrors its remote seat: every state of the room (and every move of this player
 * on its way) is replayed with the engine into the match, so the board, the score and the turn
 * are the server's, with this player's own moves shown at once.
 */
export function matchRemote<S extends MatchGame<M>, M, R>(
  store: MatchRemoteStore<S, M, R>,
  rules: GameRules<S, M>,
) {
  /** The game of the series last mirrored, and whether the next change is this player's move. */
  let mirrored = 0;
  let ownMove = false;

  const sync = (remote: RemoteGame | null): void => {
    if (!remote) {
      return;
    }
    const replayed = rules.replay(
      remote.moves as readonly M[],
      remote.rulesVersion,
      remote.variant,
    );
    if (!replayed.ok || !replayed.state) {
      console.error('The room sent a game this engine cannot replay.', remote);
      return;
    }
    const game = replayed.state;
    const next = remote.number !== mirrored;
    const grew = !next && game.moves.length > store.position().moves.length;
    const [wins, draws] = scoreOf(remote, game);
    mirrored = remote.number;
    patchState(store, {
      game,
      variant: remote.variant,
      xPlayer: remote.xPlayer,
      seat: remote.you,
      wins,
      draws,
      scored: game.status.kind !== 'in-progress',
      ready: true,
      lastRejection: null,
      // The rival's moves, followed by the board like the computer's replies.
      computerMoves: store.computerMoves() + (grew && !ownMove ? 1 : 0),
      ...(next ? { id: `online-${remote.number}`, startedAt: Date.now() } : {}),
    });
    ownMove = false;
  };

  return {
    /** Mirrors the remote seat from now on (on an online route; a local match has none). */
    _watchRemote(): void {
      const remote = store._remote;
      if (remote) {
        effect(() => {
          const game = remote.game();
          untracked(() => sync(game));
        });
      }
    },

    /** Sends this player's move and shows it at once. */
    _playRemote(move: M): void {
      const remote = store._remote;
      if (remote) {
        ownMove = true;
        remote.play(move);
        sync(remote.game());
      }
    },
  };
}
