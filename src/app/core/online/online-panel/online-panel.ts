import { Component, computed, DestroyRef, DOCUMENT, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { ONLINE_GAME, OnlineRoom } from '../online-room';

/** How long "Link copied" stays on the button. */
const COPIED_MS = 2000;

/** A player's presence: connected, without connection, or not in the room yet. */
type Presence = 'here' | 'away' | 'notYet';

interface PresenceView {
  readonly name: string;
  readonly presence: Presence;
  readonly word: string;
}

/**
 * An online game's panel, under the score when something needs saying and in the room button's
 * popover on demand: both players' presence (a filled dot connected, a ring
 * without connection, a dashed ring not in yet: shape, never the accent), one sentence when there
 * is something to say, the link to share while the rival has not joined, the way back into a room
 * this device left, and the way out. Renders nothing on a local game.
 */
@Component({
  selector: 'app-online-panel',
  imports: [Button, RouterLink],
  templateUrl: './online-panel.html',
  styleUrl: './online-panel.css',
})
export class OnlinePanel {
  /**
   * `always` (the room button's popover) shows the whole room; `needed` (the page, under the
   * score) only while something needs saying: the rival to invite, a connection on its way back,
   * the rival gone, a problem. All being well, the page keeps its room and the masthead says so.
   */
  readonly when = input<'always' | 'needed'>('always');

  protected readonly room = inject(OnlineRoom, { optional: true });
  protected readonly gameId = inject(ONLINE_GAME, { optional: true });
  protected readonly t = inject(Translator).t;
  private readonly navigator = inject(DOCUMENT).defaultView?.navigator;

  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** Sharing opens the device's share sheet where there is one; elsewhere the link is copied. */
  protected readonly canShare = typeof this.navigator?.share === 'function';

  /** Both players, while the room can be played (not on a problem or after leaving it). */
  protected readonly players = computed((): readonly PresenceView[] => {
    const room = this.room;
    if (!room || room.problem() || room.left()) {
      return [];
    }
    const t = this.t().online;
    const rival = room.rival();
    const you: Presence = room.connection() === 'open' ? 'here' : 'away';
    const them: Presence = !rival?.joined ? 'notYet' : rival.online ? 'here' : 'away';
    const view = (name: string, presence: Presence): PresenceView => ({
      name,
      presence,
      word: t[presence],
    });
    return [view(t.you, you), view(t.rival, them)];
  });

  /** One sentence when something needs saying; null while all is well. */
  protected readonly note = computed((): string | null => {
    const room = this.room;
    if (!room) {
      return null;
    }
    const t = this.t().online;
    const problem = room.problem();
    if (problem) {
      return t.problems[problem];
    }
    if (room.left()) {
      return t.left;
    }
    const connection = room.connection();
    if (connection === 'reconnecting') {
      return t.reconnecting;
    }
    if (connection !== 'open') {
      return t.connecting;
    }
    const rival = room.rival();
    if (rival && !rival.joined) {
      return t.waitingHint;
    }
    return rival && !rival.online ? t.rivalAway : null;
  });

  /** Whether the panel shows: always, or only while there is something to say. */
  protected readonly shown = computed(() => this.when() === 'always' || this.note() !== null);

  /** The rival has not taken the other seat yet: the link is what matters. */
  protected readonly waiting = computed(() => {
    const room = this.room;
    return !!room && !room.problem() && !room.left() && room.rival()?.joined === false;
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
