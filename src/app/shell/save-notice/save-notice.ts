import { Component, computed, DOCUMENT, inject } from '@angular/core';
import { Translator } from '@i18n';
import { Button, Icon } from '@kit';
import { ACTIVE_GAME } from '../active-game';

/**
 * Where the game's last save stands: a quiet "Saved" once the device confirms it, and a notice with
 * a way out when it fails (try again, or reload when another tab moved on).
 */
@Component({
  selector: 'app-save-notice',
  imports: [Button, Icon],
  templateUrl: './save-notice.html',
  styleUrl: './save-notice.css',
})
export class SaveNotice {
  protected readonly t = inject(Translator).t;
  protected readonly match = inject(ACTIVE_GAME).match;
  private readonly document = inject(DOCUMENT);

  protected readonly problem = computed((): string | null => {
    const s = this.t().save;
    switch (this.match.saveStatus()) {
      case 'quota':
        return s.quota;
      case 'failed':
        return s.failed;
      case 'unavailable':
        return s.unavailable;
      case 'conflict':
        return s.conflict;
      default:
        return null;
    }
  });

  protected readonly retryable = computed(() =>
    ['quota', 'failed'].includes(this.match.saveStatus()),
  );

  protected reload(): void {
    this.document.defaultView?.location.reload();
  }
}
