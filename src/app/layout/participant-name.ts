import type { Messages } from '@i18n';
import type { Level, Mode, Participant } from '@match';

/** Who plays a game: the mode and, against the computer, its level. */
export interface PlaySide {
  readonly mode: Mode;
  readonly level: Level;
}

/**
 * A participant's own name: against the computer the opponent's, named after its level (a train,
 * slowest to fastest), otherwise the custom name the player typed. Null when there is none, so each place picks its own fallback (symbol, "Player n").
 */
export function participantName(
  t: Messages,
  names: readonly [string, string],
  { mode, level }: PlaySide,
  participant: Participant,
): string | null {
  if (mode === 'computer' && participant === 1) {
    return t.opponents[level];
  }
  return names[participant] || null;
}
