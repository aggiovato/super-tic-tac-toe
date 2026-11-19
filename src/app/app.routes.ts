import type { Routes } from '@angular/router';
import { provideLocalGameSession } from '@session';
import { GameStore } from '@state';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@ui').then((m) => m.GamePage),
    // The store and its session live and die with the game route.
    providers: [provideLocalGameSession(), GameStore],
  },
  { path: '**', redirectTo: '' },
];
