import type {
  GameRow,
  MoveRow,
  GameRoomResult,
  GameRoomScore,
  GameRoomSetup,
  Seat,
} from '../models';

/**
 * Where one room keeps its data: its setup, seats (by token hash), games and moves. A move is unique
 * by game and revision and by its command id, so neither a retry nor a race stores two moves for
 * one turn. `now` is passed in so services own the clock.
 */
export interface GameRoomRepository {
  setup(): GameRoomSetup | null;
  /** Stores a new room with the creator on seat 0 and its first game, X on seat 0. */
  create(setup: GameRoomSetup, tokenHash: string, now: number): void;
  addSeat(seat: Seat, tokenHash: string, now: number): void;
  seatOf(tokenHash: string): Seat | null;
  takenSeats(): Seat[];
  currentGame(): GameRow;
  startGame(game: number, xSeat: Seat, now: number): void;
  /** Sets a game's result, once. */
  finishGame(game: number, result: GameRoomResult, now: number): void;
  score(): GameRoomScore;
  moves(game: number): MoveRow[];
  /** The revision a command was accepted at, if it was. */
  acceptedAt(commandId: string): number | null;
  addMove(game: number, move: MoveRow, now: number): void;
  touch(now: number): void;
  updatedAt(): number | null;
  /** Forgets the room entirely: afterwards it answers like one that never existed. */
  wipe(): void;
}
