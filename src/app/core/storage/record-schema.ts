import type { ComputerLevel } from '@catalog';
import type { PlayMode } from '@preferences';
import { type GameRecord, SCHEMA_VERSION, type Seat } from './records.model';

/** A record as version 1 stored it: a mode and a level instead of seats. */
interface GameRecordV1 extends Omit<GameRecord, 'seats' | 'schemaVersion'> {
  readonly schemaVersion: 1;
  readonly mode: 'humans' | 'opponent';
  readonly level: ComputerLevel;
}

/** A version 1 record: its mode and level stand where seats are now. */
const isVersion1 = (stored: GameRecord | GameRecordV1): stored is GameRecordV1 =>
  stored.schemaVersion === 1 && 'mode' in stored;

/**
 * A stored game in today's shape. Version 1 records gain their seats (two people, or a person
 * against the computer at its level); today's pass through; any other version is returned as it is,
 * so the match reads it as unreadable and keeps it untouched.
 */
export function readGameRecord(stored: GameRecord | GameRecordV1): GameRecord {
  if (!isVersion1(stored)) {
    return stored;
  }
  const { mode, level, ...rest } = stored;
  const other: Seat = mode === 'opponent' ? { kind: 'computer', level } : { kind: 'local' };
  return { ...rest, schemaVersion: SCHEMA_VERSION, seats: [{ kind: 'local' }, other] };
}

/** The seats of a game played on this device: participant 0 is a person, 1 a person or the computer. */
export function seatsOf(
  mode: PlayMode,
  level: ComputerLevel,
  names: readonly [string, string],
): [Seat, Seat] {
  const person = (name: string): Seat => (name ? { kind: 'local', name } : { kind: 'local' });
  return [person(names[0]), mode === 'computer' ? { kind: 'computer', level } : person(names[1])];
}

/** The mode and level a record's seats stand for, as the match and the history read them. */
export function sideOf(record: Pick<GameRecord, 'seats'>): {
  readonly mode: PlayMode;
  readonly level: ComputerLevel;
} {
  const [, other] = record.seats;
  return other.kind === 'computer'
    ? { mode: 'computer', level: other.level ?? 'beginner' }
    : { mode: 'local', level: 'beginner' };
}
