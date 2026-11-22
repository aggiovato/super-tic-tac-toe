import { describe, expect, it } from 'vitest';
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

  it('refuses a message longer than the limit before reading it', () => {
    const long = JSON.stringify({ type: 'sync', pad: 'x'.repeat(MAX_MESSAGE) });
    expect(parseClientMessage(long)).toBeNull();
  });
});
