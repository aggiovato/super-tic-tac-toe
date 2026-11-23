import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { trackTear } from '@ui';

/**
 * Cuts a ticket card's notches and perforation where its stub (`.stub`) ends, however tall the stub
 * turns out (fonts, language, tabs).
 */
@Directive({ selector: '[appTicketTear]' })
export class TicketTear {
  constructor() {
    const card = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const stub = card.querySelector<HTMLElement>('.stub');
      if (stub) {
        destroyRef.onDestroy(trackTear(stub, card));
      }
    });
  }
}
