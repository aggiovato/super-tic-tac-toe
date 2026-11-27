import { MESSAGES } from '@i18n';
import { playerLabel } from './participant-name';

const t = MESSAGES.en;
const none: readonly [string, string] = ['', ''];

describe('how a player is labelled on their card', () => {
  it('calls this device\'s player "You" against the computer, and the computer by its level', () => {
    const side = { mode: 'computer', level: 'beginner' } as const;
    expect(playerLabel(t, none, side, 0)).toBe('You');
    expect(playerLabel(t, none, side, 1)).toBe(t.opponents.beginner);
    expect(playerLabel(t, ['Ana', ''], side, 0)).toBe('Ana');
  });

  it('numbers two people here unless they typed names', () => {
    const side = { mode: 'local', level: 'beginner' } as const;
    expect(playerLabel(t, none, side, 1)).toBe('Player 2');
    expect(playerLabel(t, ['', 'Leo'], side, 1)).toBe('Leo');
  });

  it('online, "You" and "Rival" once the room names the seat', () => {
    expect(playerLabel(t, none, { mode: 'online', level: 'beginner', seat: 1 }, 1)).toBe('You');
    expect(playerLabel(t, none, { mode: 'online', level: 'beginner', seat: 1 }, 0)).toBe('Rival');
    expect(playerLabel(t, none, { mode: 'online', level: 'beginner', seat: null }, 0)).toBe(
      'Player 1',
    );
  });
});
