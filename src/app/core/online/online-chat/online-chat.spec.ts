import { TestBed } from '@angular/core/testing';
import { Translator } from '@i18n';
import type { ChatMessage, SayMessage } from '@protocol';
import { OnlineRoom } from '../online-room';
import { RoomChat } from '../room-chat';
import { OnlineChat } from './online-chat';

const said = (id: number, seat: 0 | 1, text: string): ChatMessage => ({
  id,
  clientId: `c-${id}`,
  seat,
  text,
  at: id * 1000,
});

/** The chat on a fake room where this device holds seat 0. */
function render() {
  // jsdom has no modal dialogs: enough of one for the ticket to open and close.
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.open = true;
    },
    close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
  const sent: SayMessage[] = [];
  const read: number[] = [];
  const chat = new RoomChat({
    send: (message) => sent.push(message),
    you: () => 0,
    readUpTo: () => 0,
    saveReadUpTo: (id) => read.push(id),
    now: () => 0,
  });
  TestBed.configureTestingModule({
    providers: [{ provide: OnlineRoom, useValue: { chat } as unknown as OnlineRoom }],
  });
  const fixture = TestBed.createComponent(OnlineChat);
  fixture.detectChanges();
  const t = TestBed.inject(Translator).t().chat;
  const element = fixture.nativeElement as HTMLElement;
  const button = (name: string | RegExp) =>
    [...element.querySelectorAll('button')].find((b) =>
      typeof name === 'string'
        ? (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name
        : name.test(b.getAttribute('aria-label') ?? b.textContent ?? ''),
    );
  return { fixture, chat, sent, read, t, element, button };
}

describe('the chat of a room', () => {
  it('glimpses what the rival just said, counts it unread, and reads it on opening', () => {
    const { fixture, chat, read, t, element, button } = render();
    // The history on connecting is no news: nothing to glimpse.
    chat.receive({ type: 'chat', messages: [said(1, 1, 'hola')] });
    fixture.detectChanges();
    expect(element.querySelector('.glimpse')).toBeNull();

    chat.receive({ type: 'said', message: said(2, 1, '¿otra?') });
    fixture.detectChanges();
    expect(element.querySelector('.glimpse')?.textContent).toContain('¿otra?');
    expect(button(t.open(2))).toBeTruthy();

    button(t.open(2))?.click();
    fixture.detectChanges();
    expect(read).toEqual([2]);
    expect(button(t.open(0))).toBeTruthy();
    expect(element.querySelector('.glimpse')).toBeNull();
  });

  it("never glimpses this player's own message", () => {
    const { fixture, chat, element } = render();
    chat.receive({ type: 'said', message: said(1, 0, 'mío') });
    fixture.detectChanges();
    expect(element.querySelector('.glimpse')).toBeNull();
  });

  it('sends with the button, and only what the room would keep', () => {
    const { fixture, sent, t, element, button } = render();
    const field = element.querySelector('textarea')!;
    // Only invisible characters: nothing to say, the button stays off.
    field.value = '​';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button(t.send)?.disabled).toBe(true);

    field.value = '  ¡suerte!  ';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    button(t.send)?.click();
    fixture.detectChanges();
    expect(sent.map((message) => message.text)).toEqual(['¡suerte!']);
    expect(field.value).toBe('');
  });
});
