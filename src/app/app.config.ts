import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { Preferences } from '@settings';
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
  ],
};
