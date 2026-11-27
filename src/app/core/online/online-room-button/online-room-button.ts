import {
  Component,
  computed,
  DOCUMENT,
  type ElementRef,
  effect,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { Translator } from '@i18n';
import { Button, NARROW_LAYOUT } from '@ui';
import { OnlinePanel } from '../online-panel/online-panel';
import { OnlineRoom } from '../online-room';
import { roomNeed, roomNote } from '../room-note';

/**
 * The room, in the masthead of an online game: a quiet button with one presence dot (signal green
 * with a halo while both players are connected, a ring otherwise) that opens the whole room panel
 * in a popover. On wide screens the page also shows the panel when something needs saying; on
 * narrow ones the button is the only place: its name carries the room's note, and its popover
 * opens by itself for something to act on (the link to pass on, a problem with the room, a room
 * left), closing again once it is met. Renders nothing on a local game.
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

  private readonly popover = viewChild<ElementRef<HTMLElement>>('popover');

  /** What the room says, for the button's name: null while all is well. */
  protected readonly note = computed(() =>
    this.room ? roomNote(this.room, this.t().online) : null,
  );
  protected readonly allWell = computed(() => !!this.room && this.note() === null);

  /** Something to act on: the popover opens by itself for it on narrow screens. */
  private readonly need = computed(() => (this.room ? roomNeed(this.room) : null));

  constructor() {
    const media = inject(DOCUMENT).defaultView?.matchMedia?.(NARROW_LAYOUT);
    // Opened by itself when a new need comes up; closed by itself once it is met, unless the
    // player closed it meanwhile (then it stays closed until the next need).
    let shown: string | null = null;
    let opened = false;
    effect(() => {
      const need = this.need();
      const popover = this.popover()?.nativeElement;
      untracked(() => {
        if (!popover || !media?.matches || need === shown) return;
        const open = popover.matches(':popover-open');
        if (need && !open) {
          popover.showPopover();
          opened = true;
        } else if (!need && opened && open) {
          popover.hidePopover();
        }
        if (!need) opened = false;
        shown = need;
      });
    });
  }
}
