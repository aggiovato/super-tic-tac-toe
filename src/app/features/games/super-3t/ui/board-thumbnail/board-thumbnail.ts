import { Component, inject, input, output } from '@angular/core';
import { Translator } from '@i18n';
import { Icon } from '@ui';
import { BoardPlatform } from '../board-platform/board-platform';
import type { PlatformView } from '../board-platform/platform-view.model';

/**
 * The whole game in miniature above an open board: a button that leads back to it (`back`).
 * The board that is open stands out.
 */
@Component({
  selector: 'app-board-thumbnail',
  imports: [BoardPlatform, Icon],
  templateUrl: './board-thumbnail.html',
  styleUrl: './board-thumbnail.css',
})
export class BoardThumbnail {
  readonly platforms = input.required<readonly PlatformView[]>();
  /** The open board. */
  readonly current = input.required<number>();

  readonly back = output();

  protected readonly t = inject(Translator).t;
}
