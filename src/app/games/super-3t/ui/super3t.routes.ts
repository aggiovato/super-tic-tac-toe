import type { Routes } from '@angular/router';
import { provideMatchStorage } from '@match';
import { HistoryPage, provideActiveGame } from '@shell';
import { CHALLENGES } from '@super3t/challenge';
import { provideChallenge, provideLocalGameSession, provideWorkerOpponent } from '@super3t/session';
import { GameStore } from '@super3t/state';

/** Super 3T's routes, under `/super-3t`. Each one gets its own store, session and opponent. */
export const SUPER3T_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./game-page/game-page').then((m) => m.GamePage),
    // The store, its session and the opponent's Worker live and die with the game route.
    providers: [
      provideLocalGameSession(),
      provideWorkerOpponent(),
      provideMatchStorage('super-3t'),
      GameStore,
      provideActiveGame('super-3t', GameStore),
    ],
  },
  {
    path: 'challenge/:id',
    loadComponent: () => import('./challenge-page/challenge-page').then((m) => m.ChallengePage),
    // A prepared position and its defender instead of a new game and the Worker.
    providers: [provideChallenge(), GameStore],
  },
  { path: 'history', component: HistoryPage, data: { gameId: 'super-3t' } },
  { path: 'challenge', pathMatch: 'full', redirectTo: `challenge/${CHALLENGES[0]?.id ?? ''}` },
];
