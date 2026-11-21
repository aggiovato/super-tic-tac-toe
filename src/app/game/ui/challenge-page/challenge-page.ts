import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CHALLENGES, findChallenge } from '@challenge';
import { Translator } from '@i18n';
import { Backdrop, Button, Icon } from '@kit';
import { ChallengeRun } from '@session';
import { Preferences } from '@settings';
import { GameStore } from '@state';
import { BrandTitle } from '../brand-title/brand-title';
import { ChallengePanel } from '../challenge-panel/challenge-panel';
import { DeparturePanel } from '../departure-panel/departure-panel';
import { GameBoard } from '../game-board/game-board';

/**
 * The challenge route (`/challenge/:id`): the game screen around a prepared position. The person
 * plays X against the challenge's defender; the panel replaces the score and the game's actions.
 */
@Component({
  selector: 'app-challenge-page',
  imports: [Backdrop, BrandTitle, Button, ChallengePanel, DeparturePanel, GameBoard, Icon],
  templateUrl: './challenge-page.html',
  styleUrl: '../game-page/game-page.css',
})
export class ChallengePage {
  protected readonly t = inject(Translator).t;
  private readonly router = inject(Router);

  constructor() {
    const run = inject(ChallengeRun);
    const store = inject(GameStore);
    const preferences = inject(Preferences);
    run.onSolved = (id) => preferences.markChallengeSolved(id);
    // The same component serves every challenge: each id starts a fresh attempt at its position.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const challenge = findChallenge(params.get('id') ?? '');
        if (!challenge) {
          void this.router.navigate(['/challenge', CHALLENGES[0]?.id], { replaceUrl: true });
          return;
        }
        run.challenge.set(challenge);
        store.setMode('opponent', 'beginner');
      });
  }

  protected exit(): void {
    void this.router.navigateByUrl('/');
  }
}
