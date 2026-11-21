import type { Routes } from '@angular/router';
import { provideClassicMatch } from '@classic/session';
import { ClassicStore } from '@classic/state';
import { provideActiveGame } from '@shell';

/** The classic game's route, under `/classic`: its store, session and opponent live with it. */
export const CLASSIC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./classic-page/classic-page').then((m) => m.ClassicPage),
    providers: [provideClassicMatch(), ClassicStore, provideActiveGame('classic', ClassicStore)],
  },
];
