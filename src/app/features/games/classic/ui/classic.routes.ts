import type { Routes } from '@angular/router';
import { provideClassicMatch } from '@classic/session';
import { ClassicStore } from '@classic/state';
import { preloadMatch, provideMatchStorage, provideActiveGame } from '@match';
import { openOnlineRoom, provideOnlineRoom } from '@online';
import { HistoryPage } from '@history';

/** The classic game's route, under `/classic`: its store, session and opponent live with it. */
export const CLASSIC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./classic-page/classic-page').then((m) => m.ClassicPage),
    // The saved game is read before the page renders, so it fades in already in place.
    resolve: { saved: preloadMatch('classic') },
    providers: [
      provideClassicMatch(),
      provideMatchStorage('classic'),
      ClassicStore,
      provideActiveGame('classic', ClassicStore),
    ],
  },
  {
    // An online game by invitation: the room on the server is the other player; nothing is saved here.
    path: 'online/:roomId',
    loadComponent: () => import('./classic-page/classic-page').then((m) => m.ClassicPage),
    resolve: { roomId: openOnlineRoom },
    providers: [
      provideClassicMatch(),
      provideOnlineRoom('classic'),
      ClassicStore,
      provideActiveGame('classic', ClassicStore),
    ],
  },
  { path: 'history', component: HistoryPage, data: { gameId: 'classic' } },
];
