import type { Messages } from '@i18n';
import type { Level, Mode, Participant } from '@match';

/** Who plays a game: the mode and, against the computer, its level. */
export interface PlaySide {
  readonly mode: Mode;
  readonly level: Level;
  /** Online, the participant playing on this device. */
  readonly seat?: Participant | null;
}

/**
 * A participant's own name: against the computer the opponent's, named after its level (a train,
 * slowest to fastest), online this device's typed name only, otherwise the custom name the player typed. Null when there is none, so each place picks its own fallback (symbol, "Player n").
 */
export function participantName(
  t: Messages,
  names: readonly [string, string],
  { mode, level, seat }: PlaySide,
  participant: Participant,
): string | null {
  if (mode === 'computer' && participant === 1) {
    return t.opponents[level];
  }
  // Online, this device's player goes by the first name typed here; the rival's name is not
  // known, so sentences use the symbol ("You" and "Rival" are labels, not subjects).
  if (mode === 'online') {
    return participant === seat ? names[0] || null : null;
  }
  return names[participant] || null;
}
