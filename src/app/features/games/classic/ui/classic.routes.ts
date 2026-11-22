import type { Routes } from '@angular/router';
import { provideClassicMatch } from '@classic/session';
import { ClassicStore } from '@classic/state';
import { provideMatchStorage, provideActiveGame } from '@match';
import { HistoryPage } from '@history';

/** The classic game's route, under `/classic`: its store, session and opponent live with it. */
export const CLASSIC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./classic-page/classic-page').then((m) => m.ClassicPage),
    providers: [
      provideClassicMatch(),
      provideMatchStorage('classic'),
      ClassicStore,
      provideActiveGame('classic', ClassicStore),
    ],
  },
  { path: 'history', component: HistoryPage, data: { gameId: 'classic' } },
];
