import { inject, InjectionToken, type Provider, type ProviderToken } from '@angular/core';
import type { MatchApi } from '@match';
import type { GameId } from '@settings';

/** The game on screen: which one, and its match for the app around it. */
export interface ActiveGame {
  readonly id: GameId;
  readonly match: MatchApi;
}

/** The game on screen, provided by each game's route. */
export const ACTIVE_GAME = new InjectionToken<ActiveGame>('ACTIVE_GAME');

/** Provides `ACTIVE_GAME` from a game's match store. */
export function provideActiveGame(id: GameId, store: ProviderToken<MatchApi>): Provider {
  return { provide: ACTIVE_GAME, useFactory: (): ActiveGame => ({ id, match: inject(store) }) };
}
