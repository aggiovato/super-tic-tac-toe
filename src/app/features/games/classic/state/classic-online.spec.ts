import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Move } from '@classic/core';
import { ClassicComputer, ClassicSession } from '@classic/session';
import { ComputerPlayer, GameSession, type RemoteGame, RemoteSeat } from '@match';
import { ClassicStore } from './classic-store';

/** The room as a test drives it: the server's game, and this player's moves on their way. */
class FakeRemote extends RemoteSeat {
  readonly server = signal<RemoteGame | null>(null);
  readonly sent: unknown[] = [];
  rematches = 0;

  readonly game = signal<RemoteGame | null>(null);

  /** The server's state, as the room shows it with nothing pending. */
  serve(changes: Partial<RemoteGame>): void {
    const base: RemoteGame = this.server() ?? {
      number: 1,
      rulesVersion: 1,
      variant: '',
      xPlayer: 0,
      moves: [],
      wins: [0, 0],
      draws: 0,
      scored: false,
      you: 0,
    };
    this.server.set({ ...base, ...changes });
    this.game.set(this.server());
  }

  play(move: unknown): void {
    this.sent.push(move);
    const current = this.game();
    if (current) {
      this.game.set({ ...current, moves: [...current.moves, move] });
    }
  }

  rematch(): void {
    this.rematches += 1;
  }
}

function open() {
  const remote = new FakeRemote();
  const injector = createEnvironmentInjector(
    [
      { provide: GameSession, useClass: ClassicSession },
      { provide: ComputerPlayer, useClass: ClassicComputer },
      { provide: RemoteSeat, useValue: remote },
      ClassicStore,
    ],
    TestBed.inject(EnvironmentInjector),
  );
  const store = injector.get(ClassicStore);
  TestBed.tick();
  return { store, remote };
}

const cells = (moves: readonly Move[]) => moves.map(({ cell }) => cell);

describe('an online classic match', () => {
  it('waits for the room, then mirrors its game, symbols, score and seat', () => {
    const { store, remote } = open();
    expect(store.mode()).toBe('online');
    expect(store.ready()).toBe(false);
    store.play({ cell: 4 });
    expect(remote.sent).toEqual([]);

    remote.serve({ moves: [{ cell: 4 }], xPlayer: 1, you: 0, wins: [2, 1], draws: 1 });
    TestBed.tick();
    expect(store.ready()).toBe(true);
    expect(cells(store.game().moves)).toEqual([4]);
    expect(store.xPlayer()).toBe(1);
    expect(store.seat()).toBe(0);
    expect(store.wins()).toEqual([2, 1]);
    expect(store.symbolOf(0)).toBe('O');
  });

  it("sends this player's move and shows it at once; the rival's turn takes none", () => {
    const { store, remote } = open();
    remote.serve({ you: 0 });
    TestBed.tick();
    store.play({ cell: 4 });
    expect(remote.sent).toEqual([{ cell: 4 }]);
    expect(cells(store.game().moves)).toEqual([4]);
    expect(store.legal()).toEqual([]);
    store.play({ cell: 0 });
    expect(remote.sent).toEqual([{ cell: 4 }]);
  });

  it('refuses an illegal move here, without sending it', () => {
    const { store, remote } = open();
    remote.serve({ you: 1, moves: [{ cell: 4 }] });
    TestBed.tick();
    store.play({ cell: 4 });
    expect(remote.sent).toEqual([]);
    expect(store.lastRejection()).toBe('cell-occupied');
  });

  it("follows the rival's moves like the computer's, and a refused move goes back", () => {
    const { store, remote } = open();
    remote.serve({ you: 1 });
    TestBed.tick();
    remote.serve({ moves: [{ cell: 4 }] });
    TestBed.tick();
    expect(store.computerMoves()).toBe(1);
    store.play({ cell: 0 });
    expect(store.computerMoves()).toBe(1);
    // The server went another way (the move was refused): its state stands.
    remote.serve({ moves: [{ cell: 4 }] });
    TestBed.tick();
    expect(cells(store.game().moves)).toEqual([4]);
  });

  it('counts a won game at once, and once when the server counts it too', () => {
    const { store, remote } = open();
    remote.serve({ you: 0, moves: [0, 3, 1, 4].map((cell) => ({ cell })) });
    TestBed.tick();
    store.play({ cell: 2 });
    expect(store.isOver()).toBe(true);
    expect(store.wins()).toEqual([1, 0]);
    remote.serve({ moves: [0, 3, 1, 4, 2].map((cell) => ({ cell })), wins: [1, 0], scored: true });
    TestBed.tick();
    expect(store.wins()).toEqual([1, 0]);
  });

  it('asks the room for a rematch, which brings the next game; undo and new series stay out', () => {
    const { store, remote } = open();
    remote.serve({ you: 0, moves: [{ cell: 4 }, { cell: 0 }] });
    TestBed.tick();
    expect(store.canUndo()).toBe(false);
    store.undo();
    store.newSeries();
    store.setMode('local', 'beginner');
    expect(cells(store.game().moves)).toEqual([4, 0]);
    expect(store.mode()).toBe('online');

    store.rematch();
    expect(remote.rematches).toBe(1);
    remote.serve({ number: 2, xPlayer: 1, moves: [] });
    TestBed.tick();
    expect(store.id()).toBe('online-2');
    expect(store.game().moves).toEqual([]);
    expect(store.toMove()).toBe(1);
  });
});
