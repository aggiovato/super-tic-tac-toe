import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Move } from '@fleet/core';
import { FLEET_A, FLEET_B } from '@fleet/core/testing';
import { FleetSession } from '@fleet/session';
import { ComputerPlayer, type ComputerRequest, GameSession } from '@match';
import { FleetStore } from './fleet-store';

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

function open() {
  const computer = new FakeComputer();
  const injector = createEnvironmentInjector(
    [
      { provide: GameSession, useClass: FleetSession },
      { provide: ComputerPlayer, useValue: computer },
      FleetStore,
    ],
    TestBed.inject(EnvironmentInjector),
  );
  const store = injector.get(FleetStore);
  TestBed.tick();
  store.setMode('computer', 'advanced');
  return { store, computer };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Both fleets placed: the person's (X) and the computer's (O). */
async function placed() {
  const opened = open();
  opened.store.play({ kind: 'place', player: 'X', fleet: FLEET_A });
  opened.computer.answer({ kind: 'place', player: 'O', fleet: FLEET_B });
  await flush();
  return opened;
}

describe("Ship Sink's store", () => {
  it("shows the person their view: never the computer's fleet", async () => {
    const { store } = await placed();
    expect(store.game().fleets.O).toEqual(FLEET_B);
    expect(store.view().viewer).toBe('X');
    expect(store.view().fleets).toEqual({ X: FLEET_A, O: null });
    expect(store.me()).toBe('X');
    expect(store.rival()).toBe('O');
  });

  it('aims, then fires at the aimed cell, and forgets the aim', async () => {
    const { store } = await placed();
    store.aim(90); // J1, the computer's carrier
    expect(store.aimed()).toBe(90);
    store.fire();
    expect(store.view().shots.X).toEqual([{ row: 9, col: 0, outcome: 'hit' }]);
    expect(store.lastShot()).toEqual({ by: 'X', shot: { row: 9, col: 0, outcome: 'hit' } });
    expect(store.aimed()).toBeNull();
    // A cell fired at cannot be aimed at again.
    store.aim(90);
    expect(store.aimed()).toBeNull();
  });

  it('aims at nothing while it is not the person’s turn', async () => {
    const { store, computer } = await placed();
    store.aim(11); // B2: water, the computer's turn
    store.fire();
    expect(store.computerTurn()).toBe(true);
    expect(computer.requests.at(-1)?.player).toBe('O');
    store.aim(12);
    expect(store.aimed()).toBeNull();
    store.fire();
    expect(store.view().shots.X).toHaveLength(1);
  });

  it('has no undo', async () => {
    const { store } = await placed();
    store.aim(90);
    store.fire();
    expect(store.canUndo()).toBe(false);
  });

  it('looks at its own waters through the magnifier, keeping the aim for when it looks back', async () => {
    const { store } = await placed();
    store.aim(42);
    store.look(true);
    expect(store.lookingAtOwn()).toBe(true);
    // Nothing is fired while the big board shows the person's own waters.
    expect(store.aimed()).toBeNull();
    store.fire();
    expect(store.view().shots.X).toHaveLength(0);
    store.look(false);
    expect(store.aimed()).toBe(42);
  });

  it('forgets the magnifier with a new game', async () => {
    const { store } = await placed();
    store.look(true);
    store.newSeries();
    expect(store.lookingAtOwn()).toBe(false);
  });
});
