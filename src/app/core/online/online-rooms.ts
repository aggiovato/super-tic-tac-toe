import { inject, Injectable } from '@angular/core';
import type { GameId } from '@catalog';
import { GameRoomsApi } from './game-rooms-api';
import { RoomCredentialsStore } from './room-credentials';

/** Creating a room: this device takes seat 0 and keeps its token; the room's id is the invitation. */
@Injectable({ providedIn: 'root' })
export class OnlineRooms {
  private readonly api = inject(GameRoomsApi);
  private readonly credentials = inject(RoomCredentialsStore);

  /** A new room for `gameId` in `variant`; resolves to its id. */
  async create(gameId: GameId, variant: string): Promise<string> {
    const { roomId, seat, token } = await this.api.create(gameId, variant);
    this.credentials.save(roomId, { gameId, seat, token, savedAt: Date.now() });
    return roomId;
  }
}
