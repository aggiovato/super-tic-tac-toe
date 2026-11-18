import { afterNextRender, type Injector } from '@angular/core';

/**
 * Runs a state change as a same-document view transition, so elements sharing a
 * `view-transition-name` morph between their old and new places. Falls back to an instant change
 * with reduced motion or where the API is missing. Resolves once the new view is rendered (and,
 * when animated, the transition has finished).
 */
export function runViewTransition(
  document: Document,
  injector: Injector,
  reduced: boolean,
  update: () => void,
): Promise<void> {
  if (reduced || typeof document.startViewTransition !== 'function') {
    // Resolve once the change is on screen, so callers can focus elements of the new view.
    return new Promise<void>((resolve) => {
      update();
      afterNextRender({ read: () => resolve() }, { injector });
    });
  }
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        update();
        afterNextRender({ read: () => resolve() }, { injector });
      }),
  );
  return transition.finished.catch(() => undefined);
}
