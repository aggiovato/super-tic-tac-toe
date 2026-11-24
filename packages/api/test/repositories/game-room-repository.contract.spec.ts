import { runInDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import {
  MemoryGameRoomRepository,
  type GameRoomRepository,
  SqliteGameRoomRepository,
} from '../../src/repositories';

const SETUP = { gameId: 'classic', variant: '', rulesVersion: 1 } as const;

/** Runs `check` on a fresh repository of each kind: the memory one must behave like SQLite. */
const kinds: [string, (check: (repository: GameRoomRepository) => void) => Promise<void>][] = [
  [
    'memory',
    (check) => {
      check(new MemoryGameRoomRepository());
      return Promise.resolve();
    },
  ],
  [
    'sqlite',
    async (check) => {
      const stub = env.GAME_ROOMS.get(env.GAME_ROOMS.newUniqueId());
      await runInDurableObject(stub, (_room, state) =>
        check(new SqliteGameRoomRepository(state.storage.sql)),
      );
    },
  ],
];

describe.each(kinds)('the %s room repository', (_kind, withRepository) => {
  it('stores a room with its creator on seat 0 and a first game, X on seat 0', async () => {
    await withRepository((repository) => {
      expect(repository.setup()).toBeNull();
      repository.create(SETUP, 'hash-0', 10);
      expect(repository.setup()).toEqual(SETUP);
      expect(repository.takenSeats()).toEqual([0]);
      expect(repository.seatOf('hash-0')).toBe(0);
      expect(repository.seatOf('nope')).toBeNull();
      expect(repository.currentGame()).toEqual({ game: 1, xSeat: 0, result: null });
      expect(repository.updatedAt()).toBe(10);
    });
  });

  it('keeps moves in order and finds a command once accepted', async () => {
    await withRepository((repository) => {
      repository.create(SETUP, 'h', 0);
      repository.addMove(1, { revision: 0, commandId: 'a', seat: 0, move: { cell: 4 } }, 1);
      repository.addMove(1, { revision: 1, commandId: 'b', seat: 1, move: { cell: 0 } }, 2);
      expect(repository.moves(1).map((m) => m.move)).toEqual([{ cell: 4 }, { cell: 0 }]);
      expect(repository.acceptedAt('b')).toBe(2);
      expect(repository.acceptedAt('c')).toBeNull();
    });
  });

  it('refuses a second move for one revision or one command', async () => {
    await withRepository((repository) => {
      repository.create(SETUP, 'h', 0);
      repository.addMove(1, { revision: 0, commandId: 'a', seat: 0, move: { cell: 4 } }, 1);
      expect(() =>
        repository.addMove(1, { revision: 0, commandId: 'b', seat: 0, move: { cell: 0 } }, 2),
      ).toThrow();
      expect(() =>
        repository.addMove(1, { revision: 1, commandId: 'a', seat: 1, move: { cell: 0 } }, 2),
      ).toThrow();
    });
  });

  it('sets a result once and counts it in the score', async () => {
    await withRepository((repository) => {
      repository.create(SETUP, 'h', 0);
      repository.finishGame(1, 'won-1', 5);
      repository.finishGame(1, 'won-0', 6);
      expect(repository.currentGame().result).toBe('won-1');
      repository.startGame(2, 1, 7);
      repository.finishGame(2, 'draw', 8);
      expect(repository.currentGame()).toEqual({ game: 2, xSeat: 1, result: 'draw' });
      expect(repository.score()).toEqual({ wins: [0, 1], draws: 1 });
    });
  });

  it('forgets everything on a wipe', async () => {
    await withRepository((repository) => {
      repository.create(SETUP, 'h', 0);
      repository.addSeat(1, 'g', 1);
      repository.wipe();
      expect(repository.setup()).toBeNull();
      expect(repository.takenSeats()).toEqual([]);
      expect(repository.updatedAt()).toBeNull();
      repository.create(SETUP, 'h2', 3);
      expect(repository.takenSeats()).toEqual([0]);
    });
  });

  it('keeps the chat in order, finds a message by its client id, keeps only the last ones', async () => {
    await withRepository((repository) => {
      repository.create(SETUP, 'h', 0);
      const first = repository.addChat({ clientId: 'a', seat: 0, text: 'hola' }, 5, 3);
      const second = repository.addChat({ clientId: 'b', seat: 1, text: '¿revancha?' }, 6, 3);
      expect(second.id).toBeGreaterThan(first.id);
      expect(repository.chat()).toEqual([
        { id: first.id, clientId: 'a', seat: 0, text: 'hola', at: 5 },
        { id: second.id, clientId: 'b', seat: 1, text: '¿revancha?', at: 6 },
      ]);
      expect(repository.chatBy(1, 'b')).toEqual(second);
      expect(repository.chatBy(0, 'b')).toBeNull();
      expect(repository.chatBy(1, 'nope')).toBeNull();
      // With three kept, the fourth message lets the first go.
      repository.addChat({ clientId: 'c', seat: 0, text: '3' }, 7, 3);
      repository.addChat({ clientId: 'd', seat: 1, text: '4' }, 8, 3);
      expect(repository.chat().map((message) => message.clientId)).toEqual(['b', 'c', 'd']);
      expect(() => repository.addChat({ clientId: 'd', seat: 1, text: 'x' }, 9, 3)).toThrow();
      // Each seat has its own ids: the other seat may use the same one.
      const other = repository.addChat({ clientId: 'd', seat: 0, text: 'mío' }, 9, 3);
      expect(repository.chatBy(0, 'd')).toEqual(other);
    });
  });

  it('forgets the chat on a wipe', async () => {
    await withRepository((repository) => {
      repository.create(SETUP, 'h', 0);
      repository.addChat({ clientId: 'a', seat: 0, text: 'hola' }, 1, 10);
      repository.wipe();
      repository.create(SETUP, 'h', 2);
      expect(repository.chat()).toEqual([]);
      expect(repository.chatBy(0, 'a')).toBeNull();
    });
  });
});
