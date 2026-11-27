import { describe, expect, it } from 'vitest';
import { cleanChatText } from './chat-text';
import { CHAT_MAX } from './protocol.model';

describe('the chat text both ends keep', () => {
  it('trims, and refuses nothing to say or too much', () => {
    expect(cleanChatText('  hola  ')).toBe('hola');
    expect(cleanChatText(' \n ')).toBeNull();
    expect(cleanChatText('x'.repeat(CHAT_MAX + 1))).toBeNull();
    // Counted in characters, so a full message of emoji still fits.
    expect(cleanChatText('🙂'.repeat(CHAT_MAX))).toHaveLength(CHAT_MAX * 2);
  });

  it('drops characters that hide or reorder text, keeping emoji joins and line breaks', () => {
    expect(cleanChatText('gg\u202Eevil\u200B')).toBe('ggevil');
    expect(cleanChatText('👩\u200D👧')).toBe('👩\u200D👧');
    expect(cleanChatText('a\u2028\u2028\u2028\u2029b')).toBe('a\n\nb');
    // Only invisible characters: nothing left to say.
    expect(cleanChatText('\u200B\u200E')).toBeNull();
  });
});
