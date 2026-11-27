import { CHAT_MAX, type ChatMessage, type SayMessage, type Seat } from '@protocol';
import { RoomChat } from './room-chat';

/** A chat on a fake room: what it sent, the seat it plays and what it saved as read. */
function chatAt(you: Seat | null = 0, readUpTo = 0) {
  const sent: SayMessage[] = [];
  const saved: number[] = [];
  const chat = new RoomChat({
    send: (message) => sent.push(message),
    you: () => you,
    readUpTo: () => readUpTo,
    saveReadUpTo: (id) => saved.push(id),
    now: () => 1_000,
  });
  return { chat, sent, saved };
}

const kept = (id: number, seat: Seat, text: string, clientId = `c-${id}`): ChatMessage => ({
  id,
  clientId,
  seat,
  text,
  at: id * 10,
});

describe("a room's chat on this device", () => {
  it('shows a message at once, then the room’s copy when it arrives', () => {
    const { chat, sent } = chatAt(0);
    expect(chat.say('  hola  ')).toBe(true);
    expect(sent).toEqual([{ type: 'say', clientId: sent[0]?.clientId, text: 'hola' }]);
    const clientId = sent[0]?.clientId ?? '';
    expect(chat.messages()).toEqual([
      { key: clientId, mine: true, text: 'hola', at: 1_000, state: 'sending' },
    ]);
    chat.receive({ type: 'said', message: kept(1, 0, 'hola', clientId) });
    expect(chat.messages()).toEqual([
      { key: clientId, mine: true, text: 'hola', at: 10, state: 'sent' },
    ]);
  });

  it('says nothing when there is nothing (or too much) to say', () => {
    const { chat, sent } = chatAt(0);
    expect(chat.say('   ')).toBe(false);
    expect(chat.say('x'.repeat(CHAT_MAX + 1))).toBe(false);
    expect(sent).toEqual([]);
  });

  it('marks a message the room did not keep, to retry or discard', () => {
    const { chat, sent } = chatAt(0);
    chat.say('rápido');
    const clientId = sent[0]?.clientId ?? '';
    chat.receive({ type: 'unsaid', clientId, reason: 'too-fast' });
    expect(chat.messages()[0]).toMatchObject({ state: 'refused', reason: 'too-fast' });
    // A refused message is not resent on its own when the socket opens.
    chat.resend();
    expect(sent).toHaveLength(1);
    chat.retry(clientId);
    expect(sent).toHaveLength(2);
    expect(chat.messages()[0]).toMatchObject({ state: 'sending' });
    chat.receive({ type: 'unsaid', clientId, reason: 'invalid' });
    chat.discard(clientId);
    expect(chat.messages()).toEqual([]);
  });

  it('sends again what is on its way when the socket opens', () => {
    const { chat, sent } = chatAt(0);
    chat.say('uno');
    chat.say('dos');
    chat.resend();
    expect(sent.map((message) => message.text)).toEqual(['uno', 'dos', 'uno', 'dos']);
    // The history after a reconnection holds the first: only the second stays on its way.
    chat.receive({ type: 'chat', messages: [kept(1, 0, 'uno', sent[0]?.clientId)] });
    expect(chat.messages().map((m) => `${m.text}:${m.state}`)).toEqual(['uno:sent', 'dos:sending']);
  });

  it("counts the rival's messages after the last one read, and remembers reading", () => {
    const { chat, saved } = chatAt(1, 2);
    chat.receive({
      type: 'chat',
      messages: [
        kept(1, 0, 'hola'),
        kept(2, 0, '¿listo?'),
        kept(3, 1, 'sí'),
        kept(4, 0, '¡vamos!'),
      ],
    });
    // Read up to 2 on this device: of what came after, only the rival's message counts.
    expect(chat.unread()).toBe(1);
    // The history on connecting is no arrival: nothing to glimpse.
    expect(chat.arrival()).toBeNull();
    chat.receive({ type: 'said', message: kept(5, 0, 'otro') });
    expect(chat.unread()).toBe(2);
    expect(chat.arrival()?.text).toBe('otro');
    chat.markRead();
    expect(chat.unread()).toBe(0);
    expect(saved).toEqual([5]);
  });

  it('keeps the order and never doubles a message that arrives twice', () => {
    const { chat } = chatAt(0);
    chat.receive({ type: 'said', message: kept(2, 1, 'b') });
    chat.receive({ type: 'said', message: kept(1, 1, 'a') });
    chat.receive({ type: 'said', message: kept(2, 1, 'b') });
    expect(chat.messages().map((m) => m.text)).toEqual(['a', 'b']);
  });
});
