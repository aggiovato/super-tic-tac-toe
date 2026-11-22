import { inject, type Provider } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import type { GameId } from '@catalog';
import { RemoteSeat } from '@match';
import { ONLINE_GAME, OnlineRoom } from './online-room';

/** An online route's room for `gameId`: the match reads it as its remote seat. */
export function provideOnlineRoom(gameId: GameId): Provider[] {
  return [
    { provide: ONLINE_GAME, useValue: gameId },
    OnlineRoom,
    { provide: RemoteSeat, useExisting: OnlineRoom },
  ];
}

/**
 * Opens the route's room (`:roomId`) as the route activates; resolved at once, so the page shows
 * while the seat is taken and the socket connects.
 */
export const openOnlineRoom: ResolveFn<string> = (route) => {
  const roomId = route.paramMap.get('roomId') ?? '';
  void inject(OnlineRoom).open(roomId);
  return roomId;
};
