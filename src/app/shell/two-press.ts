import { signal } from '@angular/core';

/** How long a first press waits for the second. */
export const CONFIRM_WINDOW_MS = 4000;

/**
 * An action that would throw something away: the first press asks (`pending`), a second press
 * within the window confirms. The question expires on its own.
 */
export class TwoPress {
  readonly pending = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** True when this press confirms; false when it only asks. */
  press(): boolean {
    if (this.pending()) {
      this.reset();
      return true;
    }
    this.pending.set(true);
    this.timer = setTimeout(() => this.pending.set(false), CONFIRM_WINDOW_MS);
    return false;
  }

  reset(): void {
    clearTimeout(this.timer);
    this.pending.set(false);
  }
}
