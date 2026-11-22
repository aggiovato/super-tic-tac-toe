// A room's repository: the contract, and where it is kept (the Durable Object's SQLite, or memory).
export { MemoryGameRoomRepository } from './memory/game-room.memory-repository';
export type { GameRoomRepository } from './game-room.repository';
export { SqliteGameRoomRepository } from './sqlite/game-room.sqlite-repository';
