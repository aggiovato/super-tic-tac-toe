import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { GAMES } from '@catalog';
import { Preferences } from '@preferences';
import { GAME_UI } from './game-ui';

/**
 * One route per game of the catalog, each loaded on demand with its own providers (`GAME_UI`). The app opens on the last game
 * played; the paths of the single-game versions redirect to Super 3T.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => inject(Preferences).lastGame() },
  ...GAMES.map(({ id }) => ({ path: id, loadChildren: GAME_UI[id].routes })),
  { path: 'challenge/:id', redirectTo: 'super-3t/challenge/:id' },
  { path: 'challenge', redirectTo: 'super-3t/challenge' },
  { path: '**', redirectTo: '' },
];
