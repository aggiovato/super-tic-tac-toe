import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { GameRules } from '@catalog';
import {
  applyMove,
  type GameState,
  initialState,
  legalMoves,
  mayMove,
  type Move,
  type RejectionReason,
  redactMoves,
  replay,
  replayView,
  sameMove,
} from '@fleet/core';
import { FLEET_A, FLEET_B, play } from '@fleet/core/testing';
import { signalStore } from '@ngrx/signals';
import { ComputerPlayer } from './computer';
import { GameSession } from './game-session';
import type { ComputerRequest, MatchResult } from './match.model';
import { type RemoteGame, RemoteSeat } from './remote-seat';
import { withMatch } from './with-match';

// A match of a game of hidden information, played with Ship Sink's engine (the first such game):
// placements at once, no undo, and online the player's view of the game.

const RULES: GameRules<GameState, Move> = {
  legalMoves,
  replay,
  sameMove,
  apply: applyMove,
  mayMove,
  hidden: {
    redact: redactMoves,
    replayView: (moves, rulesVersion, _variant, viewer) => replayView(moves, rulesVersion, viewer),
  },
};

const HiddenStore = signalStore(withMatch<GameState, Move, RejectionReason>(RULES));

class HiddenSession extends GameSession<GameState, Move, RejectionReason> {
  start(): GameState {
    return initialState();
  }

  play(state: GameState, move: Move): MatchResult<GameState, RejectionReason> {
    const result = applyMove(state, move);
    return result.ok ? { ok: true, state: result.state } : { ok: false, reason: result.reason };
  }
}

/** A computer the test answers by hand. */
class FakeComputer extends ComputerPlayer<Move> {
  readonly requests: ComputerRequest<Move>[] = [];
  private settle: ((move: Move | null) => void) | undefined;

  reply(request: ComputerRequest<Move>): Promise<Move | null> {
    this.requests.push(request);
    return new Promise((resolve) => (this.settle = resolve));
  }

  cancel(): void {
    this.settle?.(null);
  }

  answer(move: Move): void {
    this.settle?.(move);
  }
}

/** The room as a test drives it. */
class FakeRemote extends RemoteSeat {
  readonly sent: unknown[] = [];
  readonly game = signal<RemoteGame | null>(null);

  serve(moves: readonly unknown[], you: 0 | 1): void {
    this.game.set({
      number: 1,
      rulesVersion: 1,
      variant: '',
      xPlayer: 0,
      moves,
      wins: [0, 0],
      draws: 0,
      scored: false,
      you,
      rivalIn: true,
    });
  }

  play(move: unknown): void {
    this.sent.push(move);
    const current = this.game();
    if (current) this.game.set({ ...current, moves: [...current.moves, move] });
  }

  rematch(): void {
    // Not exercised here.
  }
}

function open(providers: unknown[]) {
  const injector = createEnvironmentInjector(
    [{ provide: GameSession, useClass: HiddenSession }, ...(providers as never[]), HiddenStore],
    TestBed.inject(EnvironmentInjector),
  );
  const store = injector.get(HiddenStore);
  TestBed.tick();
  return store;
}

/** Lets a settled reply reach the store. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('a match of hidden information against the computer', () => {
  it('lets the person and the computer place their fleets at once', async () => {
    const computer = new FakeComputer();
    const store = open([{ provide: ComputerPlayer, useValue: computer }]);
    store.setMode('computer', 'advanced');
    // The computer is asked for its fleet at once, as O.
    expect(computer.requests).toHaveLength(1);
    expect(computer.requests[0]?.player).toBe('O');
    expect(store.computerTurn()).toBe(true);
    expect(store.personTurn()).toBe(true);

    store.play({ kind: 'place', player: 'X', fleet: FLEET_A });
    expect(store.game().placed).toEqual({ X: true, O: false });
    expect(store.personTurn()).toBe(false);

    computer.answer({ kind: 'place', player: 'O', fleet: FLEET_B });
    await flush();
    expect(store.game().phase).toBe('firing');
    expect(store.personTurn()).toBe(true);
    expect(store.legal()).toHaveLength(100);
  });

  it('has no undo, which would peek at the rival waters', async () => {
    const computer = new FakeComputer();
    const store = open([{ provide: ComputerPlayer, useValue: computer }]);
    store.setMode('computer', 'beginner');
    store.play({ kind: 'place', player: 'X', fleet: FLEET_A });
    computer.answer({ kind: 'place', player: 'O', fleet: FLEET_B });
    await flush();
    store.play({ kind: 'shot', row: 1, col: 0 });
    expect(store.computerTurn()).toBe(true);
    expect(store.canUndo()).toBe(false);
    store.undo();
    expect(store.game().shots.X).toHaveLength(1);
  });
});

describe('an online match of hidden information', () => {
  it("mirrors this player's view and holds a shot as pending until the room answers", () => {
    const remote = new FakeRemote();
    const store = open([
      { provide: ComputerPlayer, useValue: new FakeComputer() },
      { provide: RemoteSeat, useValue: remote },
    ]);
    // Seat 1 plays O; X missed at B1, so O fires.
    remote.serve(redactMoves(play({ X: FLEET_A, O: FLEET_B }, 'B1'), 'O'), 1);
    TestBed.tick();
    expect(store.game().viewer).toBe('O');
    expect(store.game().fleets).toEqual({ X: null, O: FLEET_B });
    expect(store.personTurn()).toBe(true);

    store.play({ kind: 'shot', row: 0, col: 0 });
    expect(remote.sent).toEqual([{ kind: 'shot', row: 0, col: 0 }]);
    expect(store.game().shots.O).toEqual([{ row: 0, col: 0, outcome: 'pending' }]);
    expect(store.personTurn()).toBe(false);
    expect(store.remoteTurn()).toBe(true);

    // The room answers: a hit, and O fires again.
    remote.serve(redactMoves(play({ X: FLEET_A, O: FLEET_B }, 'B1 A1'), 'O'), 1);
    TestBed.tick();
    expect(store.game().shots.O).toEqual([{ row: 0, col: 0, outcome: 'hit' }]);
    expect(store.personTurn()).toBe(true);
  });

  it('lets both seats place while the other has not', () => {
    const remote = new FakeRemote();
    const store = open([
      { provide: ComputerPlayer, useValue: new FakeComputer() },
      { provide: RemoteSeat, useValue: remote },
    ]);
    remote.serve([{ kind: 'place', player: 'X' }], 1);
    TestBed.tick();
    expect(store.personTurn()).toBe(true);
    store.play({ kind: 'place', player: 'O', fleet: FLEET_B });
    expect(store.game().phase).toBe('firing');
    expect(store.remoteTurn()).toBe(true);
  });
});
