import { DestroyRef, DOCUMENT, inject, signal, type Signal } from '@angular/core';

/** Live result of a CSS media query, false where `matchMedia` is unavailable. */
export function injectMediaQuery(query: string): Signal<boolean> {
  const list = inject(DOCUMENT).defaultView?.matchMedia?.(query);
  const matches = signal(list?.matches ?? false);
  if (list) {
    const update = (event: MediaQueryListEvent): void => matches.set(event.matches);
    list.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => list.removeEventListener('change', update));
  }
  return matches.asReadonly();
}
