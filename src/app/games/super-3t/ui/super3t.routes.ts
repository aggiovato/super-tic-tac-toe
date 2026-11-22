import type { Routes } from '@angular/router';
import { provideMatchStorage } from '@match';
import { HistoryPage, provideActiveGame } from '@shell';
import { CHALLENGES } from '@super3t/challenge';
import { provideChallenge, provideSuper3tSession, provideWorkerComputer } from '@super3t/session';
import { Super3tStore } from '@super3t/state';

/** Super 3T's routes, under `/super-3t`. Each one gets its own store, session and opponent. */
export const SUPER3T_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./super3t-page/super3t-page').then((m) => m.Super3tPage),
    // The store, its session and the opponent's Worker live and die with the game route.
    providers: [
      provideSuper3tSession(),
      provideWorkerComputer(),
      provideMatchStorage('super-3t'),
      Super3tStore,
      provideActiveGame('super-3t', Super3tStore),
    ],
  },
  {
    path: 'challenge/:id',
    loadComponent: () => import('./challenge-page/challenge-page').then((m) => m.ChallengePage),
    // A prepared position and its defender instead of a new game and the Worker.
    providers: [provideChallenge(), Super3tStore],
  },
  { path: 'history', component: HistoryPage, data: { gameId: 'super-3t' } },
  { path: 'challenge', pathMatch: 'full', redirectTo: `challenge/${CHALLENGES[0]?.id ?? ''}` },
];
