import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CHAT_MAX } from '@protocol';
import { Translator } from '@i18n';
import { Button, Icon, Ticket } from '@ui';
import { OnlineRoom } from '../online-room';
import { chatText } from '../room-chat';

/** How long an incoming message is glimpsed over the button before only the dot says it is there. */
const GLIMPSE_MS = 4000;
/** From how many characters left the composer counts them down. */
const COUNT_FROM = 40;

/**
 * The room's chat, for an online game: a floating button with an Apricot dot while the rival's
 * messages wait unread (a recorded exception to the One Departure Rule), a glimpse of each new one
 * over the button for a few seconds, and the conversation in a tall ticket (the whole screen on
 * phones): bubbles, this player's on the right, each with its time and, for one on its way or not
 * kept, its state; and the composer at the tear line (Enter sends, Shift+Enter breaks the line).
 * Renders nothing on a local game.
 */
@Component({
  selector: 'app-online-chat',
  imports: [Button, Icon, Ticket],
  templateUrl: './online-chat.html',
  styleUrl: './online-chat.css',
})
export class OnlineChat {
  protected readonly room = inject(OnlineRoom, { optional: true });
  protected readonly t = inject(Translator).t;
  private readonly lang = inject(Translator).lang;

  private readonly ticket = viewChild(Ticket);
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  /** The textarea stops a draft a little past the limit (emoji count as two there). */
  protected readonly CHAT_LIMIT = CHAT_MAX * 2;

  protected readonly opened = signal(false);
  protected readonly draft = signal('');
  /** The incoming message glimpsed over the button, while it shows. */
  protected readonly glimpse = signal<string | null>(null);

  protected readonly messages = computed(() => this.room?.chat.messages() ?? []);
  protected readonly unread = computed(() => this.room?.chat.unread() ?? 0);
  protected readonly canSend = computed(() => chatText(this.draft()) !== null);
  /** Characters left, once the draft comes near the limit. */
  protected readonly left = computed(() => {
    const left = CHAT_MAX - [...this.draft().trim()].length;
    return left <= COUNT_FROM ? left : null;
  });

  private readonly time = computed(
    () => new Intl.DateTimeFormat(this.lang(), { hour: '2-digit', minute: '2-digit' }),
  );

  constructor() {
    const room = this.room;
    if (!room) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    // A new message from the rival: glimpsed over the button while the chat is closed. The first
    // value is what was already there (the history on connecting), never glimpsed.
    let seen: number | null | undefined;
    effect(() => {
      const latest = room.chat.latestFromRival();
      untracked(() => {
        const id = latest?.id ?? null;
        if (seen !== undefined && id !== null && id !== seen && !this.opened()) {
          this.glimpse.set(latest?.text ?? null);
          clearTimeout(timer);
          timer = setTimeout(() => this.glimpse.set(null), GLIMPSE_MS);
        }
        seen = id;
      });
    });
    // While the chat is open everything that arrives is read, and the newest stays in view.
    effect(() => {
      room.chat.messages();
      if (this.opened()) untracked(() => room.chat.markRead());
    });
    afterRenderEffect({
      write: () => {
        this.messages();
        // The ticket's body is what scrolls: the newest message stays in view.
        const scroller = this.list()?.nativeElement.parentElement;
        if (this.opened() && scroller) scroller.scrollTop = scroller.scrollHeight;
      },
    });
  }

  protected open(): void {
    this.glimpse.set(null);
    this.opened.set(true);
    this.ticket()?.open();
  }

  protected close(): void {
    this.ticket()?.close();
  }

  protected onClosed(): void {
    this.opened.set(false);
  }

  protected timeOf(at: number): string {
    return this.time().format(at);
  }

  protected send(event?: Event): void {
    event?.preventDefault();
    if (this.room?.chat.say(this.draft())) {
      this.draft.set('');
    }
  }

  /** Enter sends; Shift+Enter (or a composing keyboard) breaks the line. */
  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      this.send(event);
    }
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
}
