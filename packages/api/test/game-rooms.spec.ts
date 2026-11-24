import {
  evictDurableObject,
  runDurableObjectAlarm,
  runInDurableObject,
  SELF,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { HEARTBEAT, HEARTBEAT_REPLY } from '@protocol';
import type { MoveReply, GameRoomState, ServerMessage } from '../src/models';

const BASE = 'http://api.test/api';

/** A request from `address` (a fresh one by default, so the rate limit stays out of the way). */
async function call(
  path: string,
  body?: unknown,
  address = crypto.randomUUID(),
): Promise<Response> {
  return SELF.fetch(`${BASE}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': address },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function createRoom(gameId = 'classic', variant?: string) {
  const response = await call('/game-rooms', { gameId, variant });
  expect(response.status).toBe(201);
  return response.json<{ roomId: string; seat: 0; token: string }>();
}

async function joinRoom(roomId: string) {
  const response = await call(`/game-rooms/${roomId}/join`, {});
  expect(response.status).toBe(201);
  return response.json<{ seat: 1; token: string }>();
}

/** A player's socket: what it sent, and a way to wait for the next message of a kind. */
async function connect(roomId: string, token: string) {
  const response = await SELF.fetch(`${BASE}/game-rooms/${roomId}/socket?token=${token}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  if (!socket) throw new Error('No socket');
  socket.accept();
  const inbox: ServerMessage[] = [];
  const waiting: { match: (m: ServerMessage) => boolean; resolve: (m: ServerMessage) => void }[] =
    [];
  const heard: string[] = [];
  socket.addEventListener('message', (event: MessageEvent) => {
    if (event.data === HEARTBEAT_REPLY) {
      heard.push(HEARTBEAT_REPLY);
      return;
    }
    const message = JSON.parse(event.data as string) as ServerMessage;
    const waiter = waiting.findIndex(({ match }) => match(message));
    if (waiter === -1) inbox.push(message);
    else waiting.splice(waiter, 1)[0]?.resolve(message);
  });
  /** The next message that matches, already received or yet to come. */
  const next = <T extends ServerMessage>(match: (m: ServerMessage) => boolean): Promise<T> => {
    const index = inbox.findIndex(match);
    if (index !== -1) return Promise.resolve(inbox.splice(index, 1)[0] as T);
    return new Promise((resolve) =>
      waiting.push({ match, resolve: resolve as (m: ServerMessage) => void }),
    );
  };
  const state = (when: (s: GameRoomState) => boolean = () => true) =>
    next<GameRoomState>((m) => m.type === 'state' && when(m));
  const reply = (commandId: string) =>
    next<MoveReply>((m) => (m.type === 'ack' || m.type === 'refused') && m.commandId === commandId);
  const move = (commandId: string, expectedRevision: number, cell: number) => {
    socket.send(JSON.stringify({ type: 'move', commandId, expectedRevision, move: { cell } }));
    return reply(commandId);
  };
  /** Forgets what was received so far: the next wait sees only what comes after. */
  const clear = () => inbox.splice(0);
  return {
    socket,
    heard,
    next,
    state,
    reply,
    move,
    clear,
    send: (data: unknown) => socket.send(JSON.stringify(data)),
  };
}

/** A room with both seats taken and both players connected. */
async function playing(gameId = 'classic') {
  const host = await createRoom(gameId);
  const guest = await joinRoom(host.roomId);
  const x = await connect(host.roomId, host.token);
  const o = await connect(host.roomId, guest.token);
  await x.state((s) => s.seats[1].online);
  return { roomId: host.roomId, x, o, guestToken: guest.token, hostToken: host.token };
}

describe('creating and joining a room', () => {
  it('answers a health check', async () => {
    const response = await SELF.fetch(`${BASE}/health`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('creates a room for a game of the catalog, with its variant read by the catalog', async () => {
    const room = await createRoom('dots', '');
    const player = await connect(room.roomId, room.token);
    const state = await player.state();
    expect(state).toMatchObject({
      gameId: 'dots',
      variant: '3',
      game: 1,
      xSeat: 0,
      revision: 0,
      you: 0,
    });
    expect(state.seats).toEqual([
      { taken: true, online: true },
      { taken: false, online: false },
    ]);
  });

  it('refuses a game outside the catalog', async () => {
    expect((await call('/game-rooms', { gameId: 'chess' })).status).toBe(400);
    expect((await call('/game-rooms', 'not json')).status).toBe(400);
  });

  it('gives seat 1 once: a second guest finds the room full', async () => {
    const room = await createRoom();
    await joinRoom(room.roomId);
    const again = await call(`/game-rooms/${room.roomId}/join`, {});
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ error: 'full' });
  });

  it('answers 404 for a room id that is not a room', async () => {
    expect((await call('/game-rooms/not-an-id/join', {})).status).toBe(404);
    const unknown = env.GAME_ROOMS.newUniqueId().toString();
    expect((await call(`/game-rooms/${unknown}/join`, {})).status).toBe(404);
  });

  it('opens a socket only with a seat token and a WebSocket upgrade', async () => {
    const room = await createRoom();
    const wrong = await SELF.fetch(`${BASE}/game-rooms/${room.roomId}/socket?token=nope`, {
      headers: { Upgrade: 'websocket' },
    });
    expect(wrong.status).toBe(403);
    expect((await call(`/game-rooms/${room.roomId}/socket?token=${room.token}`)).status).toBe(426);
  });
});

describe('playing a move', () => {
  it('waits for the guest before the first move', async () => {
    const room = await createRoom();
    const host = await connect(room.roomId, room.token);
    expect(await host.move('c1', 0, 4)).toEqual({
      type: 'refused',
      commandId: 'c1',
      reason: 'waiting',
    });
  });

  it('accepts a move once and sends both players the new state', async () => {
    const { x, o } = await playing();
    expect(await x.move('c1', 0, 4)).toEqual({ type: 'ack', commandId: 'c1', revision: 1 });
    const seen = await o.state((s) => s.revision === 1);
    expect(seen.moves).toEqual([{ cell: 4 }]);
    expect(seen.you).toBe(1);
  });

  it('refuses a move out of turn, on an old revision, or that the engine does not take', async () => {
    const { x, o } = await playing();
    expect(await o.move('o2', 0, 0)).toMatchObject({ reason: 'not-your-turn' });
    await x.move('x1', 0, 4);
    expect(await x.move('x2', 0, 0)).toMatchObject({ reason: 'stale' });
    expect(await o.move('o3', 1, 4)).toMatchObject({ reason: 'illegal' });
    o.send({ type: 'move', commandId: 'o4', expectedRevision: 1, move: { nonsense: true } });
    expect(await o.reply('o4')).toMatchObject({ reason: 'illegal' });
  });

  it('answers a retried command with the same acknowledgement and stores it once', async () => {
    const { x, o } = await playing();
    await x.move('same', 0, 4);
    expect(await x.move('same', 0, 4)).toEqual({ type: 'ack', commandId: 'same', revision: 1 });
    expect((await o.state((s) => s.revision === 1)).moves).toHaveLength(1);
  });

  it('lets only one of two moves made on the same revision through', async () => {
    const { x } = await playing();
    x.send({ type: 'move', commandId: 'a', expectedRevision: 0, move: { cell: 0 } });
    x.send({ type: 'move', commandId: 'b', expectedRevision: 0, move: { cell: 8 } });
    const [a, b] = await Promise.all([x.reply('a'), x.reply('b')]);
    expect([a.type, b.type].sort()).toEqual(['ack', 'refused']);
    expect((await x.state((s) => s.revision === 1)).moves).toHaveLength(1);
  });

  it('answers a message that is not one with an error', async () => {
    const { x } = await playing();
    x.socket.send('{not json');
    expect(await x.next((m) => m.type === 'error')).toEqual({
      type: 'error',
      reason: 'bad-message',
    });
  });
});

describe('the end of a game and the next one', () => {
  /** X plays 0, 1, 2 and O plays 3, 4: X wins along the top row. */
  async function xWins(
    x: Awaited<ReturnType<typeof connect>>,
    o: Awaited<ReturnType<typeof connect>>,
  ) {
    const cells = [0, 3, 1, 4, 2];
    for (const [revision, cell] of cells.entries()) {
      const player = revision % 2 === 0 ? x : o;
      expect(await player.move(`m${revision}`, revision, cell)).toMatchObject({ type: 'ack' });
    }
  }

  it('records the result once and refuses any move after it', async () => {
    const { x, o } = await playing();
    await xWins(x, o);
    const end = await o.state((s) => s.result !== null);
    expect(end.result).toBe('won-0');
    expect(end.score).toEqual({ wins: [1, 0], draws: 0 });
    expect(await o.move('late', 5, 8)).toMatchObject({ reason: 'game-over' });
  });

  it('starts the next game on a rematch, symbols swapped, the score kept', async () => {
    const { x, o } = await playing();
    await xWins(x, o);
    await x.state((s) => s.result !== null);
    o.send({ type: 'rematch', game: 1 });
    const next = await x.state((s) => s.game === 2);
    expect(next).toMatchObject({ game: 2, xSeat: 1, revision: 0, result: null });
    expect(next.score.wins).toEqual([1, 0]);
    // The other player asking for the same rematch does not skip a game.
    x.clear();
    x.send({ type: 'rematch', game: 1 });
    expect((await x.state()).game).toBe(2);
  });

  it('refuses a rematch while the game goes on', async () => {
    const { x } = await playing();
    x.clear();
    x.send({ type: 'rematch', game: 1 });
    expect((await x.state()).game).toBe(1);
  });
});

describe('reconnecting and resting', () => {
  it('sends the whole state to a player who comes back', async () => {
    const { roomId, x, o, guestToken } = await playing();
    await x.move('x1', 0, 4);
    await o.state((s) => s.revision === 1);
    o.socket.close(1000, 'gone');
    await x.state((s) => !s.seats[1].online);
    const back = await connect(roomId, guestToken);
    const state = await back.state();
    expect(state).toMatchObject({ revision: 1, moves: [{ cell: 4 }], you: 1 });
    expect(state.seats[1].online).toBe(true);
  });

  it('keeps the game and its sockets when the room is evicted from memory', async () => {
    const { roomId, x, o } = await playing();
    await x.move('x1', 0, 4);
    await evictDurableObject(env.GAME_ROOMS.get(env.GAME_ROOMS.idFromString(roomId)));
    expect(await o.move('o1', 1, 0)).toMatchObject({ type: 'ack', revision: 2 });
  });

  it('keeps a room that was used lately, and deletes one left alone for a week', async () => {
    const { roomId } = await playing();
    const stub = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromString(roomId));
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect((await call(`/game-rooms/${roomId}/join`, {})).status).toBe(409);
    await runInDurableObject(stub, (_room, state) => {
      state.storage.sql.exec('UPDATE room SET updated_at = 0');
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect((await call(`/game-rooms/${roomId}/join`, {})).status).toBe(404);
  });
});

describe('limits and the heartbeat', () => {
  it('limits rooms created and joined per address and minute', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      statuses.push((await call('/game-rooms', { gameId: 'classic' }, '203.0.113.7')).status);
    }
    expect(statuses.slice(0, 20).every((status) => status === 201)).toBe(true);
    expect(statuses[20]).toBe(429);
    expect((await call('/game-rooms', { gameId: 'classic' }, '203.0.113.8')).status).toBe(201);
  });

  it('answers the heartbeat', async () => {
    const { x } = await playing();
    x.socket.send(HEARTBEAT);
    await expect.poll(() => x.heard).toEqual([HEARTBEAT_REPLY]);
  });

  it("refuses a seat's fifth socket", async () => {
    const { roomId, hostToken } = await playing();
    for (let i = 0; i < 3; i++) {
      await connect(roomId, hostToken);
    }
    const fifth = await SELF.fetch(`${BASE}/game-rooms/${roomId}/socket?token=${hostToken}`, {
      headers: { Upgrade: 'websocket' },
    });
    expect(fifth.status).toBe(429);
  });

  it('closes a socket that floods the room', async () => {
    const { x, o } = await playing();
    const closed = new Promise<number>((resolve) =>
      x.socket.addEventListener('close', (event: CloseEvent) => resolve(event.code)),
    );
    for (let i = 0; i < 30; i++) {
      x.send({ type: 'sync' });
    }
    expect(await closed).toBe(1008);
    await o.state((s) => !s.seats[0].online);
  });

  it('lets go of a socket gone silent, and tells the other player', async () => {
    const { roomId, x } = await playing();
    const stub = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromString(roomId));
    // The guest's socket last heard from long ago, with no heartbeat since.
    await runInDurableObject(stub, (_room, state) => {
      for (const socket of state.getWebSockets('seat-1')) {
        socket.serializeAttachment({ seat: 1, since: 0 });
      }
    });
    x.clear();
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    await x.state((s) => !s.seats[1].online);
  });
});

describe('a room of hidden information (Ship Sink)', () => {
  const fleetA = [
    { ship: 'carrier', row: 0, col: 0, orientation: 'h' },
    { ship: 'battleship', row: 2, col: 0, orientation: 'v' },
    { ship: 'cruiser', row: 2, col: 2, orientation: 'h' },
    { ship: 'submarine', row: 6, col: 4, orientation: 'v' },
    { ship: 'destroyer', row: 9, col: 7, orientation: 'h' },
  ];
  const fleetB = [
    { ship: 'carrier', row: 9, col: 0, orientation: 'h' },
    { ship: 'battleship', row: 0, col: 9, orientation: 'v' },
    { ship: 'cruiser', row: 4, col: 3, orientation: 'h' },
    { ship: 'submarine', row: 0, col: 5, orientation: 'v' },
    { ship: 'destroyer', row: 6, col: 7, orientation: 'v' },
  ];

  it('takes both placements made at once and never sends a seat the rival fleet', async () => {
    const { x, o } = await playing('fleet');
    // Everything seat 1 (O) hears, as text: X's fleet must never be in it.
    const heardByO: string[] = [];
    o.socket.addEventListener('message', (event: MessageEvent) => {
      heardByO.push(String(event.data));
    });
    // Both place on revision 0, at once: neither placement depends on the other.
    x.send({
      type: 'move',
      commandId: 'px',
      expectedRevision: 0,
      move: { kind: 'place', player: 'X', fleet: fleetA },
    });
    o.send({
      type: 'move',
      commandId: 'po',
      expectedRevision: 0,
      move: { kind: 'place', player: 'O', fleet: fleetB },
    });
    const [px, po] = await Promise.all([x.reply('px'), o.reply('po')]);
    expect([px.type, po.type]).toEqual(['ack', 'ack']);
    const placed = await o.state((s) => s.revision === 2);
    expect(placed.moves).toContainEqual({ kind: 'place', player: 'X' });
    expect(placed.moves).toContainEqual({ kind: 'place', player: 'O', fleet: fleetB });

    // X fires at J1, a cell of O's carrier: a hit, X fires again.
    x.send({
      type: 'move',
      commandId: 's1',
      expectedRevision: 2,
      move: { kind: 'shot', row: 9, col: 0 },
    });
    expect(await x.reply('s1')).toMatchObject({ type: 'ack', revision: 3 });
    const shot = await o.state((s) => s.revision === 3);
    expect(shot.moves.at(-1)).toEqual({ kind: 'shot', row: 9, col: 0, outcome: 'hit' });
    // O may not fire: it is still X's turn.
    o.send({
      type: 'move',
      commandId: 's2',
      expectedRevision: 3,
      move: { kind: 'shot', row: 0, col: 0 },
    });
    expect(await o.reply('s2')).toMatchObject({ reason: 'not-your-turn' });

    const leaks = heardByO.filter(
      (text) => text.includes('"fleet"') && text.includes('"player":"X","fleet"'),
    );
    expect(leaks).toEqual([]);
    expect(heardByO.join('')).not.toContain(JSON.stringify(fleetA[0]));
  });
});
