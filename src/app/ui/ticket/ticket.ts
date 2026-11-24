import {
  afterNextRender,
  Component,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * A departure ticket: a native modal dialog over the page, a Raven Deep card with notches at its
 * perforated tear line, the content above it and the actions (`[actions]`) below. It rises from the
 * bottom on phones and sits centred on wide screens; motion stops under reduced motion. Each game's
 * how-to-play puts its own rules inside.
 */
@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.html',
  styleUrl: './ticket.css',
  host: { '[class.tall]': 'tall()' },
})
export class Ticket {
  /** Id of the heading that names the dialog. */
  readonly labelledBy = input.required<string>();
  /**
   * A tall ticket (the chat): the whole screen on phones, a tall card on wide screens; its body
   * takes every pixel between the top and the tear line.
   */
  readonly tall = input(false);
  /** A tap outside the card (on the veil) closes it too, as a sheet does (the chat). */
  readonly dismissable = input(false);
  /** Emitted however the ticket closes: an action, Escape, a tap outside when dismissable. */
  readonly closed = output();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Opens the ticket with focus on its title (`labelledBy`, which needs `tabindex="-1"`): read first,
   * and no focus ring on an action nobody chose yet.
   */
  open(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>(`#${this.labelledBy()}`)?.focus();
    }
  }

  constructor() {
    // `closedby="any"` closes it natively; where a browser lacks it, a click whose target is the
    // dialog itself landed on its veil, outside the card (Escape stays the keyboard's way).
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      const outside = (event: MouseEvent) => {
        if (this.dismissable() && event.target === dialog) this.close();
      };
      dialog.addEventListener('click', outside);
      this.destroyRef.onDestroy(() => dialog.removeEventListener('click', outside));
    });
  }

  close(): void {
    this.dialog().nativeElement.close();
  }
}
