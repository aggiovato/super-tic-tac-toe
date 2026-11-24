import type { Routes } from '@angular/router';
import { provideFleetMatch } from '@fleet/session';
import { FleetStore } from '@fleet/state';
import { historyRoute } from '@history';
import { preloadMatch, provideActiveGame, provideMatchStorage } from '@match';
import { openOnlineRoom, provideOnlineRoom } from '@online';

/**
 * Ship Sink's routes, under `/fleet`: its store, session and Worker live with the route. Online,
 * the room sends this seat only its view of the game.
 */
export const FLEET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./fleet-page/fleet-page').then((m) => m.FleetPage),
    // The saved game is read before the page renders, so it fades in already in place.
    resolve: { saved: preloadMatch('fleet') },
    providers: [
      provideFleetMatch(),
      provideMatchStorage('fleet'),
      FleetStore,
      provideActiveGame('fleet', FleetStore),
    ],
    // The history opens as a ticket over the game, which stays as it is.
    children: [{ path: '', children: [] }, historyRoute('fleet')],
  },
  {
    // An online game by invitation: the room on the server is the other player; nothing is saved here.
    path: 'online/:roomId',
    loadComponent: () => import('./fleet-page/fleet-page').then((m) => m.FleetPage),
    resolve: { roomId: openOnlineRoom },
    providers: [
      provideFleetMatch(),
      provideOnlineRoom('fleet'),
      FleetStore,
      provideActiveGame('fleet', FleetStore),
    ],
    // The history opens as a ticket over the game, which stays as it is.
    children: [{ path: '', children: [] }, historyRoute('fleet')],
  },
];
