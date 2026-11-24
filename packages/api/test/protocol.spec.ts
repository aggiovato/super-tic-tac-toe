import { describe, expect, it } from 'vitest';
import { CHAT_MAX } from '@protocol';
import { MAX_MESSAGE, parseClientMessage } from '../src/protocol/parse';

describe('reading what a client sends', () => {
  it('reads a move, a rematch and a sync', () => {
    expect(
      parseClientMessage(
        JSON.stringify({ type: 'move', commandId: 'a-1', expectedRevision: 3, move: { cell: 4 } }),
      ),
    ).toEqual({ type: 'move', commandId: 'a-1', expectedRevision: 3, move: { cell: 4 } });
    expect(parseClientMessage('{"type":"rematch","game":2}')).toEqual({ type: 'rematch', game: 2 });
    expect(parseClientMessage('{"type":"sync","extra":1}')).toEqual({ type: 'sync' });
  });

  it.each([
    ['not JSON', '{nope'],
    ['not an object', '[1,2]'],
    ['an unknown type', '{"type":"cheat"}'],
    ['a move without a command id', '{"type":"move","expectedRevision":0,"move":{}}'],
    [
      'a command id with spaces',
      '{"type":"move","commandId":"a b","expectedRevision":0,"move":{}}',
    ],
    ['a negative revision', '{"type":"move","commandId":"a","expectedRevision":-1,"move":{}}'],
    [
      'a move that is not an object',
      '{"type":"move","commandId":"a","expectedRevision":0,"move":4}',
    ],
    ['a rematch without its game', '{"type":"rematch"}'],
  ])('refuses %s', (_name, raw) => {
    expect(parseClientMessage(raw)).toBeNull();
  });

  it('reads a chat message, trimmed and without control characters', () => {
    expect(
      parseClientMessage(
        JSON.stringify({ type: 'say', clientId: 'c-1', text: '  ¡Buena!\u0007\n\n\n\nOtra  ' }),
      ),
    ).toEqual({ type: 'say', clientId: 'c-1', text: '¡Buena!\n\nOtra' });
    // 280 characters (an emoji counts as one) is the most a message holds.
    const longest = '🙂'.repeat(CHAT_MAX);
    expect(
      parseClientMessage(JSON.stringify({ type: 'say', clientId: 'c', text: longest })),
    ).toMatchObject({ text: longest });
  });

  it.each([
    ['an empty message', { type: 'say', clientId: 'c', text: '   \n ' }],
    ['a message too long', { type: 'say', clientId: 'c', text: 'x'.repeat(CHAT_MAX + 1) }],
    ['a message whose text is not text', { type: 'say', clientId: 'c', text: 4 }],
  ])('refuses %s by its client id, so its writer knows which', (_name, message) => {
    expect(parseClientMessage(JSON.stringify(message))).toEqual({
      type: 'invalid-say',
      clientId: 'c',
    });
  });

  it('refuses a message without its client id outright', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'say', text: 'hola' }))).toBeNull();
  });

  it('drops characters that hide or reorder text, but keeps emoji joins', () => {
    const say = (text: string) =>
      parseClientMessage(JSON.stringify({ type: 'say', clientId: 'c', text }));
    // A right-to-left override and zero-width spaces would show the rival something else.
    expect(say('gg\u202Eevil\u200B')).toMatchObject({ text: 'ggevil' });
    // The zero-width joiner builds a family emoji: it stays.
    expect(say('👩\u200D👧')).toMatchObject({ text: '👩\u200D👧' });
    // Line and paragraph separators are line breaks, two at most in a row.
    expect(say('a\u2028\u2028\u2028\u2029b')).toMatchObject({ text: 'a\n\nb' });
  });

  it('refuses a message longer than the limit before reading it', () => {
    const long = JSON.stringify({ type: 'sync', pad: 'x'.repeat(MAX_MESSAGE) });
    expect(parseClientMessage(long)).toBeNull();
  });
});
