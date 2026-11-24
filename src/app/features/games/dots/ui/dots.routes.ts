import type { Routes } from '@angular/router';
import { provideDotsMatch } from '@dots/session';
import { DotsStore } from '@dots/state';
import { preloadMatch, provideMatchStorage, provideActiveGame } from '@match';
import { openOnlineRoom, provideOnlineRoom } from '@online';
import { historyRoute } from '@history';

/** Dots and Boxes' routes, under `/dots`: its store, session and Worker live with the route. */
export const DOTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dots-page/dots-page').then((m) => m.DotsPage),
    // The saved game is read before the page renders, so it fades in already in place.
    resolve: { saved: preloadMatch('dots') },
    providers: [
      provideDotsMatch(),
      provideMatchStorage('dots'),
      DotsStore,
      provideActiveGame('dots', DotsStore),
    ],
    // The history opens as a ticket over the game, which stays as it is.
    children: [{ path: '', children: [] }, historyRoute('dots')],
  },
  {
    // An online game by invitation: the room on the server is the other player; nothing is saved here.
    path: 'online/:roomId',
    loadComponent: () => import('./dots-page/dots-page').then((m) => m.DotsPage),
    resolve: { roomId: openOnlineRoom },
    providers: [
      provideDotsMatch(),
      provideOnlineRoom('dots'),
      DotsStore,
      provideActiveGame('dots', DotsStore),
    ],
    // The history opens as a ticket over the game, which stays as it is.
    children: [{ path: '', children: [] }, historyRoute('dots')],
  },
];
