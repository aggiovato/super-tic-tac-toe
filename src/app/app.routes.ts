import type { Routes } from '@angular/router';
import { provideLocalGameSession, provideWorkerOpponent } from '@session';
import { GameStore } from '@state';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@ui').then((m) => m.GamePage),
    // The store, its session and the opponent's Worker live and die with the game route.
    providers: [provideLocalGameSession(), provideWorkerOpponent(), GameStore],
  },
  { path: '**', redirectTo: '' },
];
