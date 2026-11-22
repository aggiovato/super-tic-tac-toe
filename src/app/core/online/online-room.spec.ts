import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { GameRoomState, JoinRefusal, SeatGrant, ServerMessage } from '@protocol';
import { GameRoomsApi, RoomsUnreachable } from './game-rooms-api';
import { OnlineRoom, SOCKET_FACTORY } from './online-room';
import { provideOnlineRoom } from './provide-online-room';
import { RoomCredentialsStore } from './room-credentials';

/** A WebSocket the test opens, closes and talks through. */
class FakeSocket extends EventTarget {
  readyState: number = WebSocket.CONNECTING;
  readonly sent: unknown[] = [];

  constructor(readonly url: string) {
    super();
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
  }

  open(): void {
    this.readyState = WebSocket.OPEN;
    this.dispatchEvent(new Event('open'));
  }

  receive(message: ServerMessage): void {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) }));
  }

  drop(reason = ''): void {
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(Object.assign(new Event('close'), { reason }));
  }
}

class FakeApi {
  joins = 0;
  answer: SeatGrant | JoinRefusal | 'unreachable' = { seat: 1, token: 'guest-token' };

  join(): Promise<SeatGrant | JoinRefusal> {
    this.joins += 1;
    const answer = this.answer;
    return answer === 'unreachable'
      ? Promise.reject(new RoomsUnreachable())
      : Promise.resolve(answer);
  }
}

const state = (changes: Partial<GameRoomState> = {}): GameRoomState => ({
  type: 'state',
  gameId: 'classic',
  variant: '',
  rulesVersion: 1,
  game: 1,
  xSeat: 0,
  moves: [],
  revision: 0,
  result: null,
  score: { wins: [0, 0], draws: 0 },
  seats: [
    { taken: true, online: true },
    { taken: true, online: true },
  ],
  you: 1,
  ...changes,
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function open(api = new FakeApi()) {
  const sockets: FakeSocket[] = [];
  const injector = createEnvironmentInjector(
    [
      provideOnlineRoom('classic'),
      { provide: GameRoomsApi, useValue: api },
      {
        provide: SOCKET_FACTORY,
        useValue: (url: string) => {
          const socket = new FakeSocket(url);
          sockets.push(socket);
          return socket as unknown as WebSocket;
        },
      },
    ],
    TestBed.inject(EnvironmentInjector),
  );
  const room = injector.get(OnlineRoom);
  await room.open('room-1');
  return { room, api, sockets, injector, last: () => sockets.at(-1)! };
}

describe('an online room', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('takes the guest seat through the invitation, keeps its token and connects with it', async () => {
    const { room, api, last } = await open();
    expect(api.joins).toBe(1);
    expect(TestBed.inject(RoomCredentialsStore).get('room-1')).toMatchObject({
      seat: 1,
      token: 'guest-token',
      gameId: 'classic',
    });
    expect(last().url).toMatch(/\/api\/game-rooms\/room-1\/socket\?token=guest-token$/);
    expect(room.invitation()).toMatch(/\/classic\/online\/room-1$/);
  });

  it('reuses a seat this device already holds', async () => {
    TestBed.inject(RoomCredentialsStore).save('room-1', {
      gameId: 'classic',
      seat: 0,
      token: 'host-token',
      savedAt: Date.now(),
    });
    const { api, last } = await open();
    expect(api.joins).toBe(0);
    expect(last().url).toContain('token=host-token');
  });

  it('says why a room cannot be joined, and tries again when the server was out of reach', async () => {
    const full = new FakeApi();
    full.answer = 'full';
    expect((await open(full)).room.problem()).toBe('full');

    const down = new FakeApi();
    down.answer = 'unreachable';
    const { room, sockets } = await open(down);
    expect(room.problem()).toBe('unreachable');
    down.answer = { seat: 1, token: 't' };
    room.retry();
    await settle();
    expect(room.problem()).toBeNull();
    expect(sockets).toHaveLength(1);
  });

  it('shows a move at once, then the state that carries it', async () => {
    const { room, last } = await open();
    last().open();
    last().receive(state());
    room.play({ cell: 4 });
    expect(last().sent).toEqual([
      expect.objectContaining({ type: 'move', expectedRevision: 0, move: { cell: 4 } }),
    ]);
    expect(room.game()?.moves).toEqual([{ cell: 4 }]);
    last().receive(state({ moves: [{ cell: 4 }], revision: 1 }));
    expect(room.game()?.moves).toEqual([{ cell: 4 }]);
  });

  it('takes a refused move back, and one the rival overtook', async () => {
    const { room, last } = await open();
    last().open();
    last().receive(state());
    room.play({ cell: 4 });
    const [{ commandId }] = last().sent as { commandId: string }[];
    last().receive({ type: 'refused', commandId, reason: 'illegal' });
    expect(room.game()?.moves).toEqual([]);

    room.play({ cell: 0 });
    last().receive(state({ moves: [{ cell: 8 }], revision: 1 }));
    expect(room.game()?.moves).toEqual([{ cell: 8 }]);
  });

  it('comes back after a lost connection and sends again what was on its way', async () => {
    vi.useFakeTimers();
    const { room, sockets, last } = await open();
    last().open();
    last().receive(state());
    last().drop();
    expect(room.connection()).toBe('reconnecting');
    room.play({ cell: 4 });
    expect(sockets[0]?.sent).toEqual([]);
    await vi.advanceTimersByTimeAsync(500);
    expect(sockets).toHaveLength(2);
    last().open();
    expect(room.connection()).toBe('open');
    expect(last().sent).toEqual([expect.objectContaining({ move: { cell: 4 } })]);
  });

  it('stops for good when the room expires', async () => {
    vi.useFakeTimers();
    const { room, sockets, last } = await open();
    last().open();
    last().drop('The room expired');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(room.problem()).toBe('expired');
    expect(room.connection()).toBe('closed');
    expect(sockets).toHaveLength(1);
  });

  it('tells whether the rival joined and is online, and asks for the rematch of this game', async () => {
    const { room, last } = await open();
    last().open();
    last().receive(
      state({
        you: 0,
        seats: [
          { taken: true, online: true },
          { taken: true, online: false },
        ],
        game: 3,
      }),
    );
    expect(room.rival()).toEqual({ joined: true, online: false });
    room.rematch();
    expect(last().sent).toEqual([{ type: 'rematch', game: 3 }]);
  });

  it('closes its socket when the route goes, and asks before taking the seat back', async () => {
    const first = await open();
    first.last().open();
    first.injector.destroy();
    expect(first.room.connection()).toBe('closed');
    expect(TestBed.inject(RoomCredentialsStore).get('room-1')?.left).toBe(true);

    // Back in the room (the back button, the link again): it waits for the player.
    const again = await open();
    expect(again.room.left()).toBe(true);
    expect(again.sockets).toHaveLength(0);
    again.room.rejoin();
    expect(again.room.left()).toBe(false);
    expect(again.sockets).toHaveLength(1);
    expect(TestBed.inject(RoomCredentialsStore).get('room-1')?.left).toBe(false);
  });
});
