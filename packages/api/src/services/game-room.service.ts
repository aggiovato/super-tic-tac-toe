import { judgeMove, nextGame, gameRoomView } from '../domain/game-room-rules';
import { CHAT_KEPT } from '@protocol';
import type {
  ChatMessage,
  JoinOutcome,
  MoveMessage,
  MoveReply,
  SayMessage,
  GameRoomSetup,
  GameRoomState,
  Seat,
} from '../models';
import type { GameRoomRepository } from '../repositories';
import { hashOf, newToken } from '../security/tokens';

/** A room with no join, move or rematch for this long is deleted. */
export const GAME_ROOM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A room's use cases: create it, take the guest's seat, recognise a seat by its token, play a move,
 * start the next game, show the room to a seat, keep its chat, expire it. What a move may do is the domain's
 * (`room-rules.ts`); where the room is kept is the repository's; how players are reached (sockets)
 * is the Durable Object's. The clock is passed in, so tests own time.
 */
export class GameRoomService {
  constructor(
    private readonly repository: GameRoomRepository,
    private readonly now: () => number = Date.now,
  ) {}

  exists(): boolean {
    return this.repository.setup() !== null;
  }

  /** Sets the room up; the creator gets seat 0 and its token. */
  async create(setup: GameRoomSetup): Promise<string> {
    if (this.exists()) {
      throw new Error('The room already exists');
    }
    const token = newToken();
    this.repository.create(setup, await hashOf(token), this.now());
    return token;
  }

  /** Gives the guest seat 1, once. */
  async join(): Promise<JoinOutcome> {
    if (!this.exists()) {
      return { ok: false, reason: 'missing' };
    }
    if (this.repository.takenSeats().includes(1)) {
      return { ok: false, reason: 'full' };
    }
    const token = newToken();
    const now = this.now();
    this.repository.addSeat(1, await hashOf(token), now);
    this.repository.touch(now);
    return { ok: true, seat: 1, token };
  }

  /** The seat a token stands for, in an existing room. */
  async seatOf(token: string): Promise<Seat | null> {
    return this.exists() ? this.repository.seatOf(await hashOf(token)) : null;
  }

  /** A move from `seat`, judged by the room's rules and stored once; a retry gets the same answer. */
  play(seat: Seat, { commandId, expectedRevision, move }: MoveMessage): MoveReply {
    const accepted = this.repository.acceptedAt(commandId);
    if (accepted !== null) {
      return { type: 'ack', commandId, revision: accepted };
    }
    const game = this.repository.currentGame();
    const moves = this.repository.moves(game.game).map((row) => row.move);
    const full = this.repository.takenSeats().includes(1);
    const verdict = judgeMove(
      { setup: this.setup(), game, moves, full },
      seat,
      expectedRevision,
      move,
    );
    if (!verdict.ok) {
      return { type: 'refused', commandId, reason: verdict.reason };
    }
    const now = this.now();
    this.repository.addMove(
      game.game,
      { revision: moves.length, commandId, seat, move: verdict.move },
      now,
    );
    if (verdict.result) {
      this.repository.finishGame(game.game, verdict.result, now);
    }
    this.repository.touch(now);
    return { type: 'ack', commandId, revision: moves.length + 1 };
  }

  /** The message `seat` already stored under its own `clientId`: a retry, if it is one. */
  said(seat: Seat, clientId: string): ChatMessage | null {
    return this.exists() ? this.repository.chatBy(seat, clientId) : null;
  }

  /**
   * A chat message from `seat`, stored once: a retry of the same `clientId` (that seat's own) gets
   * the message stored the first time (`fresh` false, so it is not sent to everyone again). Keeps
   * the room alive. Null in a room that no longer exists (expired while a socket was closing).
   *
   * A retry of a message so old that it left the kept conversation is stored again: a client only
   * retries what it has not seen arrive, which is never that far behind.
   */
  say(seat: Seat, { clientId, text }: SayMessage): { message: ChatMessage; fresh: boolean } | null {
    if (!this.exists()) {
      return null;
    }
    const stored = this.repository.chatBy(seat, clientId);
    if (stored) {
      return { message: stored, fresh: false };
    }
    const now = this.now();
    const message = this.repository.addChat({ clientId, seat, text }, now, CHAT_KEPT);
    this.repository.touch(now);
    return { message, fresh: true };
  }

  /** The room's kept chat, oldest first. */
  chat(): ChatMessage[] {
    return this.repository.chat();
  }

  /** Starts the next game once `game` is over, symbols swapped; false when it is not the time. */
  rematch(game: number): boolean {
    const next = nextGame(this.repository.currentGame(), game);
    if (!next) {
      return false;
    }
    const now = this.now();
    this.repository.startGame(next.game, next.xSeat, now);
    this.repository.touch(now);
    return true;
  }

  /** The room as `you` see it, with the seats whose players are `online`. */
  view(you: Seat, online: ReadonlySet<Seat>): GameRoomState {
    const game = this.repository.currentGame();
    return gameRoomView(
      {
        setup: this.setup(),
        game,
        moves: this.repository.moves(game.game).map((row) => row.move),
        score: this.repository.score(),
        taken: this.repository.takenSeats(),
        online,
      },
      you,
    );
  }

  /** When the room expires, a whole TTL after its last activity; null for no room. */
  expiresAt(): number | null {
    const updatedAt = this.repository.updatedAt();
    return updatedAt === null ? null : updatedAt + GAME_ROOM_TTL_MS;
  }

  /** Wipes the room if its time is up; true when it did. */
  expireIfIdle(): boolean {
    const expiresAt = this.expiresAt();
    if (expiresAt !== null && this.now() < expiresAt) {
      return false;
    }
    this.repository.wipe();
    return true;
  }

  private setup(): GameRoomSetup {
    const setup = this.repository.setup();
    if (!setup) {
      throw new Error('The room does not exist');
    }
    return setup;
  }
}
