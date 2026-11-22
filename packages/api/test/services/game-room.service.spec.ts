import { describe, expect, it } from 'vitest';
import type { MoveMessage } from '../../src/models';
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
