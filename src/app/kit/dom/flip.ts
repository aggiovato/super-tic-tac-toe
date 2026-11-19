import { afterNextRender, type Injector } from '@angular/core';

export interface FlipOptions {
  readonly duration: number;
  readonly easing: string;
}

/** Resolves after Angular has rendered the change `update` made. */
export function renderChange(injector: Injector, update: () => void): Promise<void> {
  return new Promise<void>((resolve) => {
    update();
    afterNextRender({ read: () => resolve() }, { injector });
  });
}

/**
 * FLIP: plays `element` from the box it appeared to occupy before (`from`) to where it is now,
 * using only transform, so a board grows out of its slot or settles back into it.
 */
export function flipFrom(element: HTMLElement, from: DOMRect, options: FlipOptions): Promise<void> {
  const to = element.getBoundingClientRect();
  if (!to.width || !to.height) {
    return Promise.resolve();
  }
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  const animation = element.animate(
    [
      { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transformOrigin: 'top left', transform: 'none' },
    ],
    { duration: options.duration, easing: options.easing },
  );
  return animation.finished.then(
    () => undefined,
    () => undefined,
  );
}

/** Fades elements in, slightly after the main movement starts. */
export function fadeIn(elements: Iterable<Element>, options: FlipOptions, delay = 0): void {
  for (const element of elements) {
    element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: options.duration * 0.7,
      delay,
      easing: options.easing,
      fill: 'backwards',
    });
  }
}
