import { Injectable } from '@angular/core';
import type { GameId } from '@catalog';
import {
  type CreatedGameRoom,
  type CreateGameRoomRequest,
  GAME_ROOMS_PATH,
  type JoinRefusal,
  type SeatGrant,
} from '@protocol';

/** A request the server did not answer, or answered with an error it does not explain. */
export class RoomsUnreachable extends Error {
  constructor(cause?: unknown) {
    super('The rooms server could not be reached.', { cause });
  }
}

/** The rooms' HTTP API, on the app's own origin (`/api`). */
@Injectable({ providedIn: 'root' })
export class GameRoomsApi {
  /** A new room for `gameId`; this device gets seat 0. */
  async create(gameId: GameId, variant: string): Promise<CreatedGameRoom> {
    const body: CreateGameRoomRequest = { gameId, variant };
    const response = await this.post(GAME_ROOMS_PATH, body);
    if (response.status !== 201) {
      throw new RoomsUnreachable(response.status);
    }
    return (await response.json()) as CreatedGameRoom;
  }

  /** The guest's seat in `roomId`, or why there is none. */
  async join(roomId: string): Promise<SeatGrant | JoinRefusal> {
    const response = await this.post(`${GAME_ROOMS_PATH}/${encodeURIComponent(roomId)}/join`);
    if (response.status === 201) {
      return (await response.json()) as SeatGrant;
    }
    if (response.status === 404 || response.status === 409) {
      return response.status === 404 ? 'missing' : 'full';
    }
    throw new RoomsUnreachable(response.status);
  }

  private async post(path: string, body?: unknown): Promise<Response> {
    try {
      return await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new RoomsUnreachable(error);
    }
  }
}
