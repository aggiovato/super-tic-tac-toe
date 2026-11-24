import { Component, type ElementRef, input, output, viewChild } from '@angular/core';

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
  /** Emitted however the ticket closes: an action, Escape. */
  readonly closed = output();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

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

  close(): void {
    this.dialog().nativeElement.close();
  }
}
