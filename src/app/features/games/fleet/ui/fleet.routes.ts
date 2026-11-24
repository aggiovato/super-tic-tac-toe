import type { Routes } from '@angular/router';
import { provideFleetMatch } from '@fleet/session';
import { FleetStore } from '@fleet/state';
import { historyRoute } from '@history';
import { preloadMatch, provideActiveGame, provideMatchStorage } from '@match';

/**
 * Ship Sink's routes, under `/fleet`: its store, session and Worker live with the route. Online
 * rooms come once the server hides each seat's rival fleet (phase 7e).
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
];
