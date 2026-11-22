import { readGameRecord, seatsOf, sideOf } from './record-schema';
import { type GameRecord, SCHEMA_VERSION } from './records.model';

const base = {
  id: 'g1',
  gameId: 'classic',
  rulesVersion: 1,
  seriesId: 's1',
  seed: 7,
  xPlayer: 0,
  moves: [{ cell: 4 }],
  revision: 1,
  result: null,
  startedAt: 1,
  updatedAt: 2,
  finishedAt: null,
} as const;

/** A record as version 1 stored it. */
const version1 = (mode: 'humans' | 'opponent', level = 'beginner') =>
  ({ ...base, schemaVersion: 1, mode, level }) as unknown as GameRecord;

describe('reading stored game records', () => {
  it('gives a version 1 game between two people two local seats', () => {
    const read = readGameRecord(version1('humans'));
    expect(read.schemaVersion).toBe(SCHEMA_VERSION);
    expect(read.seats).toEqual([{ kind: 'local' }, { kind: 'local' }]);
    expect(read).not.toHaveProperty('mode');
    expect(read).not.toHaveProperty('level');
    expect(read.moves).toEqual([{ cell: 4 }]);
  });

  it('seats the computer at its level in a version 1 game against it', () => {
    const read = readGameRecord(version1('opponent', 'advanced'));
    expect(read.seats).toEqual([{ kind: 'local' }, { kind: 'computer', level: 'advanced' }]);
    expect(sideOf(read)).toEqual({ mode: 'computer', level: 'advanced' });
  });

  it("keeps today's records and any unknown version as they are", () => {
    const today: GameRecord = {
      ...base,
      schemaVersion: SCHEMA_VERSION,
      seats: [{ kind: 'local', name: 'Ana' }, { kind: 'local' }],
    };
    expect(readGameRecord(today)).toBe(today);
    const future = { ...today, schemaVersion: 99 };
    expect(readGameRecord(future)).toBe(future);
  });

  it('seats people with the names they chose, and the computer with its level', () => {
    expect(seatsOf('local', 'beginner', ['Ana', ''])).toEqual([
      { kind: 'local', name: 'Ana' },
      { kind: 'local' },
    ]);
    expect(seatsOf('computer', 'intermediate', ['', 'Bea'])).toEqual([
      { kind: 'local' },
      { kind: 'computer', level: 'intermediate' },
    ]);
    expect(sideOf({ seats: [{ kind: 'local' }, { kind: 'local' }] })).toEqual({
      mode: 'local',
      level: 'beginner',
    });
  });
});
