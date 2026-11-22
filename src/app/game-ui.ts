import type { Type } from '@angular/core';
import type { LoadChildrenCallback } from '@angular/router';
import type { GameId } from '@catalog';
import { ClassicPreview } from '@classic/ui/preview';
import { DotsPreview } from '@dots/ui/preview';
import { Super3tPreview } from '@super3t/ui/preview';

/** What the app shows of a game besides its engine (`@catalog`): its routes and its preview. */
interface GameUi {
  /** Its pages, loaded on demand under `/<id>`. */
  readonly routes: LoadChildrenCallback;
  /** Its scene in the game library; light, so it loads with the app. */
  readonly preview: Type<unknown>;
}

/**
 * Every game's UI, by id: a game in the catalog without its routes or preview here does not
 * compile.
 */
export const GAME_UI: Readonly<Record<GameId, GameUi>> = {
  'super-3t': {
    routes: () => import('@super3t/ui').then((m) => m.SUPER3T_ROUTES),
    preview: Super3tPreview,
  },
  classic: {
    routes: () => import('@classic/ui').then((m) => m.CLASSIC_ROUTES),
    preview: ClassicPreview,
  },
  dots: {
    routes: () => import('@dots/ui').then((m) => m.DOTS_ROUTES),
    preview: DotsPreview,
  },
};

/** The previews the game library shows (`GAME_PREVIEWS`). */
export const GAME_PREVIEW_COMPONENTS = Object.fromEntries(
  Object.entries(GAME_UI).map(([id, ui]) => [id, ui.preview]),
) as Readonly<Record<GameId, Type<unknown>>>;
