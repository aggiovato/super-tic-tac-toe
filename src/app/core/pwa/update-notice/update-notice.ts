import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { type SaveStatus, ACTIVE_GAME } from '@match';
import { filter, firstValueFrom } from 'rxjs';
import { AppUpdates } from '../app-updates';

/** A game on screen is safe to reload: everything is saved, or there was nothing to save. */
const isSafe = (status: SaveStatus): boolean => status === 'saved' || status === 'idle';

/**
 * Offers a new version of the app once it is downloaded, and never at the cost of a move: it waits
 * while the game is being saved, and switching waits for that save. If the game could not be saved
 * (no space, a private window, another tab), it says the last moves would be lost and the player
 * decides. A broken cached version reloads by itself as soon as no save is under way. Pages without
 * a game (the history) switch at once.
 */
@Component({
  selector: 'app-update-notice',
  imports: [Button],
  templateUrl: './update-notice.html',
  styleUrl: './update-notice.css',
})
export class UpdateNotice {
  protected readonly t = inject(Translator).t;
  private readonly updates = inject(AppUpdates);
  private readonly match = inject(ACTIVE_GAME, { optional: true })?.match ?? null;
  private readonly status = computed((): SaveStatus => this.match?.saveStatus() ?? 'idle');
  private readonly settled$ = toObservable(this.status).pipe(
    filter((status) => status !== 'saving'),
  );

  /** Switching: waiting for the save, then reloading. */
  protected readonly applying = signal(false);

  /** The game could not be saved: switching would lose its last moves. */
  protected readonly unsaved = computed(() => !isSafe(this.status()) && this.status() !== 'saving');

  protected readonly shown = computed(
    () => this.updates.ready() && (this.applying() || this.status() !== 'saving'),
  );

  constructor() {
    // A version that can no longer load its files: reload once no save is under way.
    effect(() => {
      if (this.updates.broken() && this.status() !== 'saving') {
        void this.updates.apply();
      }
    });
  }

  protected async apply(): Promise<void> {
    if (this.applying()) {
      return;
    }
    // A press on "Update anyway" is the player's consent to lose what was not saved.
    const consented = this.unsaved();
    this.applying.set(true);
    // The notice is hidden while a save is under way, so a press normally finds it settled; should
    // one still be running, wait for its outcome.
    const now = this.status();
    const status = now === 'saving' ? await firstValueFrom(this.settled$) : now;
    if (!isSafe(status) && !consented) {
      // The save under way failed: ask again, now with the warning.
      this.applying.set(false);
      return;
    }
    await this.updates.apply();
  }
}
