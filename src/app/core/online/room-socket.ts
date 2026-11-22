import { signal } from '@angular/core';
import type { ClientMessage, ServerMessage } from '@protocol';
import type { ConnectionState } from './online.model';

/** Opens a WebSocket; replaced in tests. */
export type SocketFactory = (url: string) => WebSocket;

/** The close code and reason the room sends when it expires: no point in trying again. */
const EXPIRED = 'The room expired';
const MAX_DELAY_MS = 8000;

/**
 * A room's socket that comes back by itself: a lost connection is retried with a growing delay (up
 * to 8 s), at once when the device is back online or the page visible again. Messages sent while it
 * is down are not queued here; the room resends what is still pending when it opens.
 */
export class RoomSocket {
  readonly state = signal<ConnectionState>('connecting');

  private socket: WebSocket | null = null;
  private failures = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(
    private readonly url: string,
    private readonly create: SocketFactory,
    private readonly handlers: {
      readonly open: () => void;
      readonly message: (message: ServerMessage) => void;
      readonly expired: () => void;
    },
  ) {}

  connect(): void {
    if (this.closed || this.socket) {
      return;
    }
    this.clearTimer();
    const socket = this.create(this.url);
    this.socket = socket;
    socket.addEventListener('open', () => {
      this.failures = 0;
      this.state.set('open');
      this.handlers.open();
    });
    socket.addEventListener('message', ({ data }: MessageEvent) => {
      if (typeof data !== 'string') {
        return;
      }
      try {
        this.handlers.message(JSON.parse(data) as ServerMessage);
      } catch (error) {
        console.error('The room sent a message that is not JSON.', error);
      }
    });
    socket.addEventListener('close', ({ reason }: CloseEvent) => this.lost(socket, reason));
  }

  /** Tries again now, if the socket is down (the device came back online, the page is visible). */
  retryNow(): void {
    if (!this.closed && !this.socket) {
      this.failures = 0;
      this.connect();
    }
  }

  /** Sends when open; false when the socket is down (the message is not kept). */
  send(message: ClientMessage): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(JSON.stringify(message));
    return true;
  }

  close(): void {
    this.closed = true;
    this.clearTimer();
    this.socket?.close(1000, 'Left the room');
    this.socket = null;
    this.state.set('closed');
  }

  private lost(socket: WebSocket, reason: string): void {
    if (this.socket !== socket) {
      return;
    }
    this.socket = null;
    if (this.closed) {
      return;
    }
    if (reason === EXPIRED) {
      this.close();
      this.handlers.expired();
      return;
    }
    this.state.set('reconnecting');
    const delay = Math.min(MAX_DELAY_MS, 500 * 2 ** this.failures);
    this.failures += 1;
    this.timer = setTimeout(() => this.connect(), delay);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
