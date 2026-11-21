import type { Routes } from '@angular/router';
import { CHALLENGES } from '@challenge';
import { provideChallenge, provideLocalGameSession, provideWorkerOpponent } from '@session';
import { GameStore } from '@state';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@ui').then((m) => m.GamePage),
    // The store, its session and the opponent's Worker live and die with the game route.
    providers: [provideLocalGameSession(), provideWorkerOpponent(), GameStore],
  },
  {
    path: 'challenge/:id',
    loadComponent: () => import('@ui').then((m) => m.ChallengePage),
    // A prepared position and its defender instead of a new game and the Worker.
    providers: [provideChallenge(), GameStore],
  },
  { path: 'challenge', pathMatch: 'full', redirectTo: `challenge/${CHALLENGES[0]?.id ?? ''}` },
  { path: '**', redirectTo: '' },
];
