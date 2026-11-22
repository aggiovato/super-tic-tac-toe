import { DurableObject } from 'cloudflare:workers';
import type { ClientMessage, JoinOutcome, GameRoomSetup, Seat, ServerMessage } from '../models';
import { parseClientMessage } from '../protocol/parse';
import { SqliteGameRoomRepository } from '../repositories';
import { GameRoomService } from '../services/game-room.service';

const seatOf = (socket: WebSocket) => (socket.deserializeAttachment() as { seat: Seat }).seat;

/**
 * One room as a Durable Object: transport only. It holds its players' sockets (hibernatable), turns
 * their messages into calls to the room's service (on its SQLite repository), sends every player
 * the whole state after each change, and schedules the room's expiry with an alarm.
 */
export class GameRoom extends DurableObject<Env> {
  private readonly rooms: GameRoomService;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.rooms = new GameRoomService(new SqliteGameRoomRepository(ctx.storage.sql));
  }

  /** Sets the room up; the creator gets seat 0 and its token (RPC from the controller). */
  async create(setup: GameRoomSetup): Promise<string> {
    const token = await this.rooms.create(setup);
    await this.scheduleExpiry();
    return token;
  }

  /** Gives the guest seat 1, once (RPC from the controller). */
  async join(): Promise<JoinOutcome> {
    const outcome = await this.rooms.join();
    if (outcome.ok) {
      await this.scheduleExpiry();
      this.broadcast();
    }
    return outcome;
  }

  /** A player's socket: its token names its seat; it receives the state at once. */
  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket', { status: 426 });
    }
    const seat = await this.rooms.seatOf(new URL(request.url).searchParams.get('token') ?? '');
    if (seat === null) {
      return new Response('Unknown room or seat', { status: 403 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    // Hibernatable: the room sleeps between moves and wakes for the next message.
    this.ctx.acceptWebSocket(server, [`seat-${seat}`]);
    server.serializeAttachment({ seat });
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(socket: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const message = typeof data === 'string' ? parseClientMessage(data) : null;
    if (!message) {
      this.send(socket, { type: 'error', reason: 'bad-message' });
      return;
    }
    await this.handle(socket, seatOf(socket), message);
  }

  override webSocketClose(socket: WebSocket): void {
    socket.close();
    this.broadcast();
  }

  override webSocketError(): void {
    this.broadcast();
  }

  /** Expires the room once it was left alone for its whole TTL; else checks again then. */
  override async alarm(): Promise<void> {
    if (!this.rooms.expireIfIdle()) {
      await this.scheduleExpiry();
      return;
    }
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(1000, 'The room expired');
    }
  }

  private async handle(socket: WebSocket, seat: Seat, message: ClientMessage): Promise<void> {
    if (message.type === 'sync') {
      this.send(socket, this.rooms.view(seat, this.online()));
      return;
    }
    const changed =
      message.type === 'rematch'
        ? this.rooms.rematch(message.game)
        : this.reply(socket, this.rooms.play(seat, message));
    if (changed) {
      await this.scheduleExpiry();
      this.broadcast();
    } else {
      this.send(socket, this.rooms.view(seat, this.online()));
    }
  }

  /** Answers the sender of a move; true when it was accepted. */
  private reply(socket: WebSocket, reply: ReturnType<GameRoomService['play']>): boolean {
    this.send(socket, reply);
    return reply.type === 'ack';
  }

  private online(): Set<Seat> {
    return new Set(this.ctx.getWebSockets().map(seatOf));
  }

  /** Every open socket receives the state, as its own seat sees it. */
  private broadcast(): void {
    if (!this.rooms.exists()) {
      return;
    }
    const online = this.online();
    for (const socket of this.ctx.getWebSockets()) {
      this.send(socket, this.rooms.view(seatOf(socket), online));
    }
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A socket closing as we write: its player gets the state on reconnecting.
    }
  }

  private async scheduleExpiry(): Promise<void> {
    const expiresAt = this.rooms.expiresAt();
    if (expiresAt !== null) {
      await this.ctx.storage.setAlarm(expiresAt);
    }
  }
}
