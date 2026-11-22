import { InjectionToken, type Type } from '@angular/core';
import type { GameId } from '@catalog';

/**
 * Each game's scene for the library, a component taking a `square` input. Provided by the app
 * (`game-ui.ts`): the shell lists the games without knowing any of them.
 */
export const GAME_PREVIEWS = new InjectionToken<Readonly<Record<GameId, Type<unknown>>>>(
  'GAME_PREVIEWS',
);
