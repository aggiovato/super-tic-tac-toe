import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CHALLENGES, findChallenge } from '@super3t/challenge';
import { Translator } from '@i18n';
import { Button, Icon } from '@kit';
import { ChallengeRun } from '@super3t/session';
import { BrandTitle, GameLayout } from '@shell';
import { Preferences } from '@preferences';
import { Super3tStore } from '@super3t/state';
import { ChallengePanel } from '../challenge-panel/challenge-panel';
import { DeparturePanel } from '../departure-panel/departure-panel';
import { Super3tBoard } from '../super3t-board/super3t-board';

/**
 * The challenge route (`/super-3t/challenge/:id`): the game screen around a prepared position. The person
 * plays X against the challenge's defender; the panel replaces the score and the game's actions.
 */
@Component({
  selector: 'app-challenge-page',
  imports: [BrandTitle, Button, ChallengePanel, DeparturePanel, Super3tBoard, GameLayout, Icon],
  templateUrl: './challenge-page.html',
})
export class ChallengePage {
  protected readonly t = inject(Translator).t;
  private readonly router = inject(Router);
  private readonly store = inject(Super3tStore);
  /** Boards won in the attempt, for the title's TIP, TAP, TOE. */
  protected readonly wonBoards = computed(
    () => this.store.game().boards.filter((board) => board.kind === 'won').length,
  );

  constructor() {
    const run = inject(ChallengeRun);
    const store = inject(Super3tStore);
    const preferences = inject(Preferences);
    run.onSolved = (id) => preferences.markChallengeSolved(id);
    // The same component serves every challenge: each id starts a fresh attempt at its position.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const challenge = findChallenge(params.get('id') ?? '');
        if (!challenge) {
          void this.router.navigate(['/super-3t/challenge', CHALLENGES[0]?.id], {
            replaceUrl: true,
          });
          return;
        }
        run.challenge.set(challenge);
        store.setMode('computer', 'beginner');
      });
  }

  protected exit(): void {
    void this.router.navigateByUrl('/super-3t');
  }
}
