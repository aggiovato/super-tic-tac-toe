import { HEARTBEAT, HEARTBEAT_REPLY } from '@protocol';
import { DurableObject } from 'cloudflare:workers';
import type { GameRoomSetup, JoinOutcome, SayMessage, Seat, ServerMessage } from '../models';
import { parseClientMessage, type ReadMessage } from '../protocol/parse';
import { SqliteGameRoomRepository } from '../repositories';
import {
  ChatBudget,
  isSilent,
  MAX_SOCKETS_PER_SEAT,
  MessageBudget,
  SWEEP_MS,
} from '../security/limits';
import { GameRoomService } from '../services/game-room.service';

/** What a socket carries through hibernation: its seat and when it connected. */
interface SocketInfo {
  readonly seat: Seat;
  readonly since: number;
}

const infoOf = (socket: WebSocket) => socket.deserializeAttachment() as SocketInfo;
const seatOf = (socket: WebSocket) => infoOf(socket).seat;

/**
 * One room as a Durable Object: transport only. It holds its players' sockets (hibernatable), turns
 * their messages into calls to the room's service (on its SQLite repository), sends every player
 * the whole state after each change, and keeps an alarm: the room's expiry, and while players are
 * connected a sweep that lets go of sockets gone silent (a lost network sends no close). It answers
 * the clients' heartbeat without waking, refuses a seat's fifth socket and closes a flooding one.
 */
export class GameRoom extends DurableObject<Env> {
  private readonly rooms: GameRoomService;
  private readonly budgets = new WeakMap<WebSocket, MessageBudget>();
  private readonly chatBudgets = new WeakMap<WebSocket, ChatBudget>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.rooms = new GameRoomService(new SqliteGameRoomRepository(ctx.storage.sql));
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HEARTBEAT, HEARTBEAT_REPLY));
  }

  /** Sets the room up; the creator gets seat 0 and its token (RPC from the controller). */
  async create(setup: GameRoomSetup): Promise<string> {
    const token = await this.rooms.create(setup);
    await this.schedule();
    return token;
  }

  /** Gives the guest seat 1, once (RPC from the controller). */
  async join(): Promise<JoinOutcome> {
    const outcome = await this.rooms.join();
    if (outcome.ok) {
      await this.schedule();
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
    if (this.ctx.getWebSockets(`seat-${seat}`).length >= MAX_SOCKETS_PER_SEAT) {
      return new Response('Too many sockets for this seat', { status: 429 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    // Hibernatable: the room sleeps between moves and wakes for the next message.
    this.ctx.acceptWebSocket(server, [`seat-${seat}`]);
    server.serializeAttachment({ seat, since: Date.now() } satisfies SocketInfo);
    await this.schedule();
    this.broadcast();
    // The conversation so far, to this socket alone (the others have it).
    this.send(server, { type: 'chat', messages: this.rooms.chat() });
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(socket: WebSocket, data: string | ArrayBuffer): Promise<void> {
    if (!this.budgetOf(socket).spend(Date.now())) {
      socket.close(1008, 'Too many messages');
      this.broadcast(socket);
      return;
    }
    const message = typeof data === 'string' ? parseClientMessage(data) : null;
    if (!message) {
      this.send(socket, { type: 'error', reason: 'bad-message' });
      return;
    }
    await this.handle(socket, seatOf(socket), message);
  }

  // While its close or error is handled, the socket may still be listed as open: it is left out.
  override webSocketClose(socket: WebSocket): void {
    socket.close();
    this.broadcast(socket);
  }

  override webSocketError(socket: WebSocket): void {
    this.broadcast(socket);
  }

  /** Expires the room once it was left alone for its whole TTL; else lets go of silent sockets. */
  override async alarm(): Promise<void> {
    if (this.rooms.expireIfIdle()) {
      for (const socket of this.ctx.getWebSockets()) {
        socket.close(1000, 'The room expired');
      }
      return;
    }
    this.sweep();
    await this.schedule();
  }

  /** Closes the sockets not heard from (no heartbeat) for too long, and tells the others. */
  private sweep(): void {
    const now = Date.now();
    const silent = this.sockets().filter((socket) => {
      const heartbeat = this.ctx.getWebSocketAutoResponseTimestamp(socket)?.getTime() ?? 0;
      return isSilent(Math.max(heartbeat, infoOf(socket).since), now);
    });
    for (const socket of silent) {
      socket.close(1001, 'No heartbeat');
    }
    if (silent.length > 0) {
      this.broadcast(...silent);
    }
  }

  private budgetOf(socket: WebSocket): MessageBudget {
    let budget = this.budgets.get(socket);
    if (!budget) {
      budget = new MessageBudget(Date.now());
      this.budgets.set(socket, budget);
    }
    return budget;
  }

  private async handle(socket: WebSocket, seat: Seat, message: ReadMessage): Promise<void> {
    if (message.type === 'invalid-say') {
      this.send(socket, { type: 'unsaid', clientId: message.clientId, reason: 'invalid' });
      return;
    }
    if (message.type === 'sync') {
      this.send(socket, this.rooms.view(seat, this.online()));
      return;
    }
    if (message.type === 'say') {
      await this.say(socket, seat, message);
      return;
    }
    const changed =
      message.type === 'rematch'
        ? this.rooms.rematch(message.game)
        : this.reply(socket, this.rooms.play(seat, message));
    if (changed) {
      await this.schedule();
      this.broadcast();
    } else {
      this.send(socket, this.rooms.view(seat, this.online()));
    }
  }

  /**
   * A chat message, as the service decides it (a retry back to its writer without spending the
   * socket's chat budget, a new one within it to everyone, one past it refused by its `clientId`).
   */
  private async say(socket: WebSocket, seat: Seat, message: SayMessage): Promise<void> {
    const outcome = this.rooms.say(seat, message, () =>
      this.chatBudgetOf(socket).spend(Date.now()),
    );
    if (!outcome) {
      return;
    }
    if ('refused' in outcome) {
      this.send(socket, { type: 'unsaid', clientId: message.clientId, reason: outcome.refused });
      return;
    }
    if (!outcome.fresh) {
      this.send(socket, { type: 'said', message: outcome.message });
      return;
    }
    await this.schedule();
    for (const open of this.sockets()) {
      this.send(open, { type: 'said', message: outcome.message });
    }
  }

  private chatBudgetOf(socket: WebSocket): ChatBudget {
    let budget = this.chatBudgets.get(socket);
    if (!budget) {
      budget = new ChatBudget(Date.now());
      this.chatBudgets.set(socket, budget);
    }
    return budget;
  }

  /** Answers the sender of a move; true when it was accepted. */
  private reply(socket: WebSocket, reply: ReturnType<GameRoomService['play']>): boolean {
    this.send(socket, reply);
    return reply.type === 'ack';
  }

  /** The players' open sockets, but those `leaving` (being closed). */
  private sockets(...leaving: WebSocket[]): WebSocket[] {
    return this.ctx
      .getWebSockets()
      .filter((socket) => !leaving.includes(socket) && socket.readyState === WebSocket.OPEN);
  }

  private online(...leaving: WebSocket[]): Set<Seat> {
    return new Set(this.sockets(...leaving).map(seatOf));
  }

  /** Every open socket receives the state, as its own seat sees it. */
  private broadcast(...leaving: WebSocket[]): void {
    if (!this.rooms.exists()) {
      return;
    }
    const online = this.online(...leaving);
    for (const socket of this.sockets(...leaving)) {
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

  /** The next alarm: the room's expiry, or sooner the next sweep while players are connected. */
  private async schedule(): Promise<void> {
    const expiresAt = this.rooms.expiresAt();
    if (expiresAt === null) {
      return;
    }
    const sweep = this.ctx.getWebSockets().length > 0 ? Date.now() + SWEEP_MS : Infinity;
    await this.ctx.storage.setAlarm(Math.min(expiresAt, sweep));
  }
}
