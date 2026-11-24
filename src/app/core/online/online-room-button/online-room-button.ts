import { Component, computed, inject } from '@angular/core';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { OnlinePanel } from '../online-panel/online-panel';
import { OnlineRoom } from '../online-room';

/**
 * The room, in the masthead of an online game: a quiet button with one presence dot (filled
 * Chalk while both players are connected, a ring otherwise: shape, never the accent) that opens
 * the whole room panel in a popover. The page itself shows the panel only when something needs
 * saying. Renders nothing on a local game.
 */
@Component({
  selector: 'app-online-room-button',
  imports: [Button, OnlinePanel],
  templateUrl: './online-room-button.html',
  styleUrl: './online-room-button.css',
})
export class OnlineRoomButton {
  protected readonly room = inject(OnlineRoom, { optional: true });
  protected readonly t = inject(Translator).t;

  /** Both players connected and nothing wrong. */
  protected readonly allWell = computed(() => {
    const room = this.room;
    const rival = room?.rival();
    return (
      !!room &&
      !room.problem() &&
      !room.left() &&
      room.connection() === 'open' &&
      !!rival?.joined &&
      rival.online
    );
  });
}
