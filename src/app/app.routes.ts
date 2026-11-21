import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { Preferences } from '@settings';

/**
 * One route per game, each loaded on demand with its own providers. The app opens on the last game
 * played; the paths of the single-game versions redirect to Super 3T.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => inject(Preferences).lastGame() },
  { path: 'super-3t', loadChildren: () => import('@super3t/ui').then((m) => m.SUPER3T_ROUTES) },
  { path: 'classic', loadChildren: () => import('@classic/ui').then((m) => m.CLASSIC_ROUTES) },
  { path: 'challenge/:id', redirectTo: 'super-3t/challenge/:id' },
  { path: 'challenge', redirectTo: 'super-3t/challenge' },
  { path: '**', redirectTo: '' },
];
