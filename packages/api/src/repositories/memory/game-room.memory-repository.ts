import type {
  GameRow,
  MoveRow,
  GameRoomResult,
  GameRoomScore,
  GameRoomSetup,
  Seat,
} from '../../models';
import type { GameRoomRepository } from '../game-room.repository';

interface StoredGame extends GameRow {
  readonly moves: MoveRow[];
}

/**
 * A room's repository in memory: for service tests, with the same rules as the SQLite one (the
 * contract spec runs on both). It keeps no timestamps but the last activity.
 */
export class MemoryGameRoomRepository implements GameRoomRepository {
  private room: (GameRoomSetup & { updatedAt: number }) | null = null;
  private readonly seats = new Map<Seat, string>();
  private games: StoredGame[] = [];

  setup(): GameRoomSetup | null {
    if (!this.room) return null;
    const { gameId, variant, rulesVersion } = this.room;
    return { gameId, variant, rulesVersion };
  }

  create(setup: GameRoomSetup, tokenHash: string, now: number): void {
    if (this.room) throw new Error('The room already exists');
    this.room = { ...setup, updatedAt: now };
    this.addSeat(0, tokenHash);
    this.startGame(1, 0);
  }

  addSeat(seat: Seat, tokenHash: string): void {
    if (this.seats.has(seat)) throw new Error(`Seat ${seat} is taken`);
    this.seats.set(seat, tokenHash);
  }

  seatOf(tokenHash: string): Seat | null {
    return [...this.seats].find(([, hash]) => hash === tokenHash)?.[0] ?? null;
  }

  takenSeats(): Seat[] {
    return [...this.seats.keys()].sort();
  }

  currentGame(): GameRow {
    const game = this.games.at(-1);
    if (!game) throw new Error('A room always has a game');
    return { game: game.game, xSeat: game.xSeat, result: game.result };
  }

  startGame(game: number, xSeat: Seat): void {
    this.games.push({ game, xSeat, result: null, moves: [] });
  }

  finishGame(game: number, result: GameRoomResult): void {
    this.games = this.games.map((row) =>
      row.game === game && row.result === null ? { ...row, result } : row,
    );
  }

  score(): GameRoomScore {
    const count = (result: GameRoomResult) =>
      this.games.filter((game) => game.result === result).length;
    return { wins: [count('won-0'), count('won-1')], draws: count('draw') };
  }

  moves(game: number): MoveRow[] {
    return [...(this.games.find((row) => row.game === game)?.moves ?? [])];
  }

  acceptedAt(commandId: string): number | null {
    for (const game of this.games) {
      const move = game.moves.find((row) => row.commandId === commandId);
      if (move) return move.revision + 1;
    }
    return null;
  }

  addMove(game: number, move: MoveRow): void {
    const row = this.games.find((candidate) => candidate.game === game);
    if (!row) throw new Error(`No game ${game}`);
    if (
      row.moves.some((m) => m.revision === move.revision) ||
      this.acceptedAt(move.commandId) !== null
    ) {
      throw new Error('A move for that revision or command is already stored');
    }
    row.moves.push(move);
  }

  touch(now: number): void {
    if (this.room) this.room.updatedAt = now;
  }

  updatedAt(): number | null {
    return this.room?.updatedAt ?? null;
  }

  wipe(): void {
    this.room = null;
    this.seats.clear();
    this.games = [];
  }
}
