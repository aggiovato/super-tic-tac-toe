import { Component, computed, DestroyRef, DOCUMENT, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { ONLINE_GAME, OnlineRoom } from '../online-room';

/** How long "Link copied" stays on the button. */
const COPIED_MS = 2000;

/**
 * An online game's panel, under the board: the link to share while the rival has not joined, then
 * the connection (this device's and the rival's), why the room cannot be played when it cannot,
 * and the way out. Renders nothing on a local game.
 */
@Component({
  selector: 'app-online-panel',
  imports: [Button, RouterLink],
  templateUrl: './online-panel.html',
  styleUrl: './online-panel.css',
})
export class OnlinePanel {
  protected readonly room = inject(OnlineRoom, { optional: true });
  protected readonly gameId = inject(ONLINE_GAME, { optional: true });
  protected readonly t = inject(Translator).t;
  private readonly navigator = inject(DOCUMENT).defaultView?.navigator;

  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** Sharing opens the device's share sheet where there is one; elsewhere the link is copied. */
  protected readonly canShare = typeof this.navigator?.share === 'function';

  /** One sentence on how the game stands online; null while there is nothing to say. */
  protected readonly status = computed((): { text: string; warn: boolean } | null => {
    const room = this.room;
    if (!room || room.problem()) {
      return null;
    }
    const t = this.t().online;
    const connection = room.connection();
    if (connection === 'reconnecting') {
      return { text: t.reconnecting, warn: true };
    }
    if (connection !== 'open') {
      return { text: t.connecting, warn: false };
    }
    const rival = room.rival();
    if (rival?.joined && !rival.online) {
      return { text: t.rivalAway, warn: true };
    }
    return rival?.joined ? { text: t.connected, warn: false } : null;
  });

  /** The rival has not taken the other seat yet: the link is what matters. */
  protected readonly waiting = computed(() => {
    const room = this.room;
    return !!room && !room.problem() && room.rival()?.joined === false;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected async share(): Promise<void> {
    const url = this.room?.invitation();
    if (!url) {
      return;
    }
    const game = this.gameId ? this.t().games[this.gameId] : '';
    try {
      if (this.canShare) {
        await this.navigator?.share({ url, text: this.t().online.shareText(game) });
        return;
      }
      await this.navigator?.clipboard.writeText(url);
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), COPIED_MS);
    } catch {
      // Sharing dismissed or the clipboard refused: the link stays in its field to copy by hand.
    }
  }

  protected selectAll(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }
}
