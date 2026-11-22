import type { Routes } from '@angular/router';
import { provideDotsMatch } from '@dots/session';
import { DotsStore } from '@dots/state';
import { provideMatchStorage } from '@match';
import { HistoryPage, provideActiveGame } from '@shell';

/** Dots and Boxes' routes, under `/dots`: its store, session and Worker live with the route. */
export const DOTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./dots-page/dots-page').then((m) => m.DotsPage),
    providers: [
      provideDotsMatch(),
      provideMatchStorage('dots'),
      DotsStore,
      provideActiveGame('dots', DotsStore),
    ],
  },
  { path: 'history', component: HistoryPage, data: { gameId: 'dots' } },
];
