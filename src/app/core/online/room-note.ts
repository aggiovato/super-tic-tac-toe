import type { Messages } from '@i18n';
import type { OnlineRoom } from './online-room';

/** What the room needs from this player, if anything: the room panel opens by itself for it. */
export type RoomNeed = 'invite' | 'problem' | 'left';

/** The one sentence a room needs said, or null while all is well. */
export function roomNote(room: OnlineRoom, t: Messages['online']): string | null {
  const problem = room.problem();
  if (problem) {
    return t.problems[problem];
  }
  if (room.left()) {
    return t.left;
  }
  const connection = room.connection();
  if (connection === 'reconnecting') {
    return t.reconnecting;
  }
  if (connection !== 'open') {
    return t.connecting;
  }
  const rival = room.rival();
  if (rival && !rival.joined) {
    return t.waitingHint;
  }
  return rival && !rival.online ? t.rivalAway : null;
}

/** Something this player has to act on (not a passing state such as reconnecting). */
export function roomNeed(room: OnlineRoom): RoomNeed | null {
  if (room.problem()) return 'problem';
  if (room.left()) return 'left';
  return room.rival()?.joined === false ? 'invite' : null;
}
