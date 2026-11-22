import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Preferences } from '@preferences';
import { provideAppUpdates } from '@shell';
import { provideGameRepository } from '@storage';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Moving between pages (a game, its history, a challenge, another game) cross-fades with a
    // short rise (styles.css), skipped when motion is reduced.
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: ({ transition }) => {
          if (inject(Preferences).reducedMotion()) {
            transition.skipTransition();
          }
        },
      }),
    ),
    provideGameRepository(),
    // Offline play (production builds only): the shell, every game, the opponents' Workers, fonts
    // and textures are cached once the app is stable (ngsw-config.json).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // New versions: heard from the start, offered once the game is saved (UpdateNotice).
    provideAppUpdates(),
  ],
};
