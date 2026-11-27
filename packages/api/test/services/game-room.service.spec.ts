import { describe, expect, it } from 'vitest';
import type { ChatMessage, MoveMessage, SayOutcome } from '../../src/models';
import { MemoryGameRoomRepository } from '../../src/repositories';
import { GAME_ROOM_TTL_MS, GameRoomService } from '../../src/services/game-room.service';

/** A room's service on a memory repository and a clock the test moves. */
async function room(gameId: 'classic' | 'dots' = 'classic') {
  let time = 1_000;
  const service = new GameRoomService(new MemoryGameRoomRepository(), () => time);
  const hostToken = await service.create({
    gameId,
    variant: gameId === 'dots' ? '3' : '',
    rulesVersion: 1,
  });
  return {
    service,
    hostToken,
    later: (ms: number) => {
      time += ms;
    },
  };
}

const move = (commandId: string, expectedRevision: number, cell: number): MoveMessage => ({
  type: 'move',
  commandId,
  expectedRevision,
  move: { cell },
});

describe('the room service', () => {
  it('creates a room once and recognises its seats by their tokens', async () => {
    const { service, hostToken } = await room();
    await expect(
      service.create({ gameId: 'classic', variant: '', rulesVersion: 1 }),
    ).rejects.toThrow();
    const guest = await service.join();
    expect(guest).toMatchObject({ ok: true, seat: 1 });
    expect(await service.join()).toEqual({ ok: false, reason: 'full' });
    expect(await service.seatOf(hostToken)).toBe(0);
    expect(await service.seatOf(guest.ok ? guest.token : '')).toBe(1);
    expect(await service.seatOf('stolen')).toBeNull();
  });

  it('answers a join in a room that does not exist', async () => {
    const service = new GameRoomService(new MemoryGameRoomRepository());
    expect(await service.join()).toEqual({ ok: false, reason: 'missing' });
    expect(await service.seatOf('any')).toBeNull();
  });

  it('plays moves through the rules and acknowledges a retry the same way', async () => {
    const { service } = await room();
    expect(service.play(0, move('a', 0, 4))).toMatchObject({ type: 'refused', reason: 'waiting' });
    await service.join();
    expect(service.play(0, move('a', 0, 4))).toEqual({ type: 'ack', commandId: 'a', revision: 1 });
    expect(service.play(0, move('a', 0, 4))).toEqual({ type: 'ack', commandId: 'a', revision: 1 });
    expect(service.play(0, move('b', 1, 0))).toMatchObject({ reason: 'not-your-turn' });
    expect(service.view(1, new Set([1])).moves).toEqual([{ cell: 4 }]);
  });

  it('records the winner, then starts the next game with symbols swapped', async () => {
    const { service } = await room();
    await service.join();
    for (const [revision, cell] of [0, 3, 1, 4, 2].entries()) {
      service.play(revision % 2 === 0 ? 0 : 1, move(`m${revision}`, revision, cell));
    }
    expect(service.view(0, new Set()).result).toBe('won-0');
    expect(service.rematch(2)).toBe(false);
    expect(service.rematch(1)).toBe(true);
    expect(service.rematch(1)).toBe(false);
    expect(service.view(0, new Set())).toMatchObject({
      game: 2,
      xSeat: 1,
      revision: 0,
      score: { wins: [1, 0] },
    });
  });

  it('expires a room a whole TTL after its last activity, not before', async () => {
    const { service, later } = await room();
    later(GAME_ROOM_TTL_MS - 1);
    await service.join();
    later(GAME_ROOM_TTL_MS - 1);
    expect(service.expireIfIdle()).toBe(false);
    later(1);
    expect(service.expireIfIdle()).toBe(true);
    expect(service.exists()).toBe(false);
    expect(service.expiresAt()).toBeNull();
  });
});

/** A message the room kept, or a failure naming what came instead. */
function kept(outcome: SayOutcome): ChatMessage {
  if (!outcome || 'refused' in outcome) throw new Error(`not kept: ${JSON.stringify(outcome)}`);
  return outcome.message;
}

describe('the chat of a room', () => {
  it('stores a message once, a retry getting the same one back, and keeps the room alive', async () => {
    const { service, later } = await room();
    const expiry = service.expiresAt();
    later(1_000);
    const said = kept(service.say(0, { type: 'say', clientId: 'm1', text: 'hola' }));
    expect(said).toEqual({ id: said.id, clientId: 'm1', seat: 0, text: 'hola', at: 2_000 });
    expect(service.expiresAt()).toBe((expiry ?? 0) + 1_000);
    expect(service.say(0, { type: 'say', clientId: 'm1', text: 'hola' })).toEqual({
      fresh: false,
      message: said,
    });
    expect(service.chat()).toEqual([said]);
  });

  it('spends the budget on new messages only: a retry always gets through', async () => {
    const { service } = await room();
    let left = 1;
    const spend = () => left-- > 0;
    const first = kept(service.say(0, { type: 'say', clientId: 'a', text: 'uno' }, spend));
    expect(service.say(0, { type: 'say', clientId: 'b', text: 'dos' }, spend)).toEqual({
      refused: 'too-fast',
    });
    // The budget is spent, yet resending the first (a reconnection) gets it back.
    expect(service.say(0, { type: 'say', clientId: 'a', text: 'uno' }, spend)).toEqual({
      fresh: false,
      message: first,
    });
    expect(service.chat()).toEqual([first]);
  });

  it("never lets one seat reach the other's message through its id", async () => {
    const { service } = await room();
    const mine = kept(service.say(0, { type: 'say', clientId: 'same', text: 'del anfitrión' }));
    const theirs = service.say(1, { type: 'say', clientId: 'same', text: 'del invitado' });
    expect(theirs).toMatchObject({ fresh: true, message: { seat: 1, text: 'del invitado' } });
    expect(service.say(0, { type: 'say', clientId: 'same', text: 'x' })).toEqual({
      fresh: false,
      message: mine,
    });
  });

  it('keeps nothing once the room is gone', async () => {
    const { service, later } = await room();
    later(GAME_ROOM_TTL_MS + 1);
    expect(service.expireIfIdle()).toBe(true);
    expect(service.say(0, { type: 'say', clientId: 'late', text: 'hola' })).toBeNull();
    expect(service.chat()).toEqual([]);
  });
});
