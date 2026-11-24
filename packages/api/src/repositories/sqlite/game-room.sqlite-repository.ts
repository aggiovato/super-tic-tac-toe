import type { GameId } from '@catalog';
import type {
  ChatMessage,
  GameRow,
  NewChatMessage,
  MoveRow,
  GameRoomResult,
  GameRoomScore,
  GameRoomSetup,
  Seat,
} from '../../models';
import type { GameRoomRepository } from '../game-room.repository';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS room (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    game_id TEXT NOT NULL,
    variant TEXT NOT NULL,
    rules_version INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS seats (
    seat INTEGER PRIMARY KEY CHECK (seat IN (0, 1)),
    token_hash TEXT NOT NULL,
    joined_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS games (
    game INTEGER PRIMARY KEY,
    x_seat INTEGER NOT NULL CHECK (x_seat IN (0, 1)),
    result TEXT,
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS moves (
    game INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    command_id TEXT NOT NULL UNIQUE,
    seat INTEGER NOT NULL,
    move TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (game, revision)
  );
  CREATE TABLE IF NOT EXISTS chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    seat INTEGER NOT NULL CHECK (seat IN (0, 1)),
    text TEXT NOT NULL,
    at INTEGER NOT NULL,
    UNIQUE (seat, client_id)
  );
`;

// A type, not an interface: SqlStorage's rows need the index signature an interface lacks.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type ChatRow = { id: number; client_id: string; seat: number; text: string; at: number };

const chatOf = (row: ChatRow): ChatMessage => ({
  id: row.id,
  clientId: row.client_id,
  seat: row.seat as Seat,
  text: row.text,
  at: row.at,
});

/** A room's repository in its Durable Object's own SQLite database. */
export class SqliteGameRoomRepository implements GameRoomRepository {
  constructor(private readonly sql: SqlStorage) {
    this.ensureSchema();
  }

  /** Creates the tables if missing. */
  private ensureSchema(): void {
    this.sql.exec(SCHEMA);
  }

  wipe(): void {
    this.sql.exec(
      'DROP TABLE IF EXISTS chat; DROP TABLE IF EXISTS moves; DROP TABLE IF EXISTS games; DROP TABLE IF EXISTS seats; DROP TABLE IF EXISTS room;',
    );
    this.ensureSchema();
  }

  setup(): GameRoomSetup | null {
    const [row] = this.sql
      .exec<{ game_id: string; variant: string; rules_version: number }>(
        'SELECT game_id, variant, rules_version FROM room WHERE id = 1',
      )
      .toArray();
    return row
      ? { gameId: row.game_id as GameId, variant: row.variant, rulesVersion: row.rules_version }
      : null;
  }

  create(setup: GameRoomSetup, tokenHash: string, now: number): void {
    this.sql.exec(
      'INSERT INTO room (id, game_id, variant, rules_version, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?)',
      setup.gameId,
      setup.variant,
      setup.rulesVersion,
      now,
      now,
    );
    this.addSeat(0, tokenHash, now);
    this.startGame(1, 0, now);
  }

  addSeat(seat: Seat, tokenHash: string, now: number): void {
    this.sql.exec(
      'INSERT INTO seats (seat, token_hash, joined_at) VALUES (?, ?, ?)',
      seat,
      tokenHash,
      now,
    );
  }

  seatOf(tokenHash: string): Seat | null {
    const [row] = this.sql
      .exec<{ seat: number }>('SELECT seat FROM seats WHERE token_hash = ?', tokenHash)
      .toArray();
    return row ? (row.seat as Seat) : null;
  }

  takenSeats(): Seat[] {
    return this.sql
      .exec<{ seat: number }>('SELECT seat FROM seats ORDER BY seat')
      .toArray()
      .map((row) => row.seat as Seat);
  }

  currentGame(): GameRow {
    const [row] = this.sql
      .exec<{ game: number; x_seat: number; result: string | null }>(
        'SELECT game, x_seat, result FROM games ORDER BY game DESC LIMIT 1',
      )
      .toArray();
    if (!row) {
      throw new Error('A room always has a game');
    }
    return {
      game: row.game,
      xSeat: row.x_seat as Seat,
      result: row.result as GameRoomResult | null,
    };
  }

  startGame(game: number, xSeat: Seat, now: number): void {
    this.sql.exec(
      'INSERT INTO games (game, x_seat, started_at) VALUES (?, ?, ?)',
      game,
      xSeat,
      now,
    );
  }

  finishGame(game: number, result: GameRoomResult, now: number): void {
    this.sql.exec(
      'UPDATE games SET result = ?, finished_at = ? WHERE game = ? AND result IS NULL',
      result,
      now,
      game,
    );
  }

  /** Wins by seat and draws over the finished games. */
  score(): GameRoomScore {
    const rows = this.sql
      .exec<{ result: string; n: number }>(
        'SELECT result, COUNT(*) AS n FROM games WHERE result IS NOT NULL GROUP BY result',
      )
      .toArray();
    const count = (result: GameRoomResult) => rows.find((row) => row.result === result)?.n ?? 0;
    return { wins: [count('won-0'), count('won-1')], draws: count('draw') };
  }

  moves(game: number): MoveRow[] {
    return this.sql
      .exec<{ revision: number; command_id: string; seat: number; move: string }>(
        'SELECT revision, command_id, seat, move FROM moves WHERE game = ? ORDER BY revision',
        game,
      )
      .toArray()
      .map((row) => ({
        revision: row.revision,
        commandId: row.command_id,
        seat: row.seat as Seat,
        move: JSON.parse(row.move) as unknown,
      }));
  }

  /** The revision a command was accepted at, if it was. */
  acceptedAt(commandId: string): number | null {
    const [row] = this.sql
      .exec<{ revision: number }>('SELECT revision FROM moves WHERE command_id = ?', commandId)
      .toArray();
    return row ? row.revision + 1 : null;
  }

  addMove(game: number, row: MoveRow, now: number): void {
    this.sql.exec(
      'INSERT INTO moves (game, revision, command_id, seat, move, at) VALUES (?, ?, ?, ?, ?, ?)',
      game,
      row.revision,
      row.commandId,
      row.seat,
      JSON.stringify(row.move),
      now,
    );
  }

  chat(): ChatMessage[] {
    return this.sql
      .exec<ChatRow>('SELECT id, client_id, seat, text, at FROM chat ORDER BY id')
      .toArray()
      .map(chatOf);
  }

  chatBy(seat: Seat, clientId: string): ChatMessage | null {
    const [row] = this.sql
      .exec<ChatRow>(
        'SELECT id, client_id, seat, text, at FROM chat WHERE seat = ? AND client_id = ?',
        seat,
        clientId,
      )
      .toArray();
    return row ? chatOf(row) : null;
  }

  addChat(message: NewChatMessage, now: number, kept: number): ChatMessage {
    const [row] = this.sql
      .exec<ChatRow>(
        'INSERT INTO chat (client_id, seat, text, at) VALUES (?, ?, ?, ?) RETURNING id, client_id, seat, text, at',
        message.clientId,
        message.seat,
        message.text,
        now,
      )
      .toArray();
    if (!row) throw new Error('The chat message was not stored');
    // Only the last `kept` stay: the oldest go first.
    this.sql.exec('DELETE FROM chat WHERE id <= ?', row.id - kept);
    return chatOf(row);
  }

  touch(now: number): void {
    this.sql.exec('UPDATE room SET updated_at = ? WHERE id = 1', now);
  }

  updatedAt(): number | null {
    const [row] = this.sql
      .exec<{ updated_at: number }>('SELECT updated_at FROM room WHERE id = 1')
      .toArray();
    return row?.updated_at ?? null;
  }
}
