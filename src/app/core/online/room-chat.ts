import { computed, signal } from '@angular/core';
import {
  cleanChatText,
  type ChatMessage,
  type ChatRefusal,
  type ChatServerMessage,
  type SayMessage,
  type Seat,
} from '@protocol';
import type { ChatEntry } from './online.model';

/** One of this player's messages the room has not kept yet. */
interface Outgoing {
  readonly clientId: string;
  readonly text: string;
  readonly at: number;
  readonly refused?: ChatRefusal;
}

/** What the chat needs from its room: a way to send, this device's seat, and where it keeps what it read. */
export interface RoomChatLink {
  send(message: SayMessage): void;
  you(): Seat | null;
  /** The last message read here (its id), from this device's storage. */
  readUpTo(): number;
  saveReadUpTo(id: number): void;
  now(): number;
}

/**
 * A room's chat on this device: the conversation the room keeps, then this player's messages on
 * their way, each shown at once and replaced by the room's copy when its `said` comes back (matched
 * by client id). A message the room did not keep stays, marked, to retry or discard. Everything on
 * its way is sent again when the socket opens. Unread are the rival's messages after the last one
 * read on this device, which is remembered per room.
 */
export class RoomChat {
  private readonly kept = signal<readonly ChatMessage[]>([]);
  private readonly outbox = signal<readonly Outgoing[]>([]);
  private readonly read = signal(0);

  constructor(private readonly link: RoomChatLink) {}

  /** The conversation, oldest first: what the room keeps, then this player's on its way. */
  readonly messages = computed((): readonly ChatEntry[] => {
    const you = this.link.you();
    const kept = this.kept().map((message): ChatEntry => ({
      key: message.seat === you ? message.clientId : `id-${message.id}`,
      mine: message.seat === you,
      text: message.text,
      at: message.at,
      state: 'sent',
    }));
    const outgoing = this.outbox().map((message): ChatEntry => ({
      key: message.clientId,
      mine: true,
      text: message.text,
      at: message.at,
      state: message.refused ? 'refused' : 'sending',
      ...(message.refused ? { reason: message.refused } : {}),
    }));
    return [...kept, ...outgoing];
  });

  /** The rival's messages after the last one read on this device. */
  readonly unread = computed(() => {
    const you = this.link.you();
    const read = this.read();
    return this.kept().filter((message) => message.seat !== you && message.id > read).length;
  });

  /**
   * The rival's message that just came in (one `said`, never the history sent on connecting), for a
   * glimpse of it; a later one replaces it.
   */
  private readonly arrived = signal<ChatMessage | null>(null);
  readonly arrival = this.arrived.asReadonly();

  /** Sends a message, shown at once; false when there is nothing (or too much) to say. */
  say(text: string): boolean {
    const clean = cleanChatText(text);
    if (clean === null) return false;
    const message: Outgoing = { clientId: crypto.randomUUID(), text: clean, at: this.link.now() };
    this.outbox.update((outbox) => [...outbox, message]);
    this.link.send({ type: 'say', clientId: message.clientId, text: message.text });
    return true;
  }

  /** Sends again a message the room did not keep. */
  retry(clientId: string): void {
    const message = this.outbox().find((outgoing) => outgoing.clientId === clientId);
    if (!message?.refused) return;
    this.outbox.update((outbox) =>
      outbox.map((outgoing) =>
        outgoing.clientId === clientId
          ? { clientId, text: outgoing.text, at: outgoing.at }
          : outgoing,
      ),
    );
    this.link.send({ type: 'say', clientId, text: message.text });
  }

  /** Forgets a message the room did not keep. */
  discard(clientId: string): void {
    this.outbox.update((outbox) => outbox.filter((outgoing) => outgoing.clientId !== clientId));
  }

  /** Everything read: the newest message kept so far, remembered on this device. */
  markRead(): void {
    const newest = this.kept().at(-1)?.id ?? 0;
    if (newest > this.read()) {
      this.read.set(newest);
      this.link.saveReadUpTo(newest);
    }
  }

  /** The socket opened: what is on its way (not refused) goes again; the room keeps each once. */
  resend(): void {
    for (const message of this.outbox()) {
      if (!message.refused) {
        this.link.send({ type: 'say', clientId: message.clientId, text: message.text });
      }
    }
  }

  receive(message: ChatServerMessage): void {
    switch (message.type) {
      case 'chat':
        this.read.set(Math.max(this.read(), this.link.readUpTo()));
        this.kept.set(message.messages);
        this.dropArrived(message.messages);
        return;
      case 'said': {
        const said = message.message;
        if (this.kept().some((known) => known.id === said.id)) {
          return;
        }
        this.kept.update((kept) => [...kept, said].sort((a, b) => a.id - b.id));
        if (said.seat !== this.link.you()) {
          this.arrived.set(said);
        }
        this.dropArrived([said]);
        return;
      }
      case 'unsaid':
        this.outbox.update((outbox) =>
          outbox.map((outgoing) =>
            outgoing.clientId === message.clientId
              ? { ...outgoing, refused: message.reason }
              : outgoing,
          ),
        );
    }
  }

  /** This player's messages the room now keeps leave the outbox. */
  private dropArrived(arrived: readonly ChatMessage[]): void {
    const you = this.link.you();
    const ids = new Set(arrived.filter((m) => m.seat === you).map((m) => m.clientId));
    if (ids.size > 0) {
      this.outbox.update((outbox) => outbox.filter((outgoing) => !ids.has(outgoing.clientId)));
    }
  }
}
