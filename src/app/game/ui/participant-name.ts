import type { Messages } from '@i18n';
import type { Mode, Participant } from '@state';

/**
 * A participant's own name: the opponent's against the computer, otherwise the custom name the
 * player typed. Null when there is none, so each place picks its own fallback (symbol, "Player n").
 */
export function participantName(
  t: Messages,
  names: readonly [string, string],
  mode: Mode,
  participant: Participant,
): string | null {
  if (mode === 'opponent' && participant === 1) {
    return t.opponent;
  }
  return names[participant] || null;
}
