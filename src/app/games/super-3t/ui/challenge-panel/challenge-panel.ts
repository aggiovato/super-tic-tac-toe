import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CHALLENGES, judge } from '@super3t/challenge';
import { Translator } from '@i18n';
import { Button, ChoiceGroup, type ChoiceOption } from '@kit';
import { ChallengeRun } from '@super3t/session';
import { Preferences } from '@preferences';
import { Super3tStore } from '@super3t/state';

/**
 * The challenge's side of the screen: which challenge (solved ones marked), the goal, how the
 * attempt stands and the way to try again or move on.
 */
@Component({
  selector: 'app-challenge-panel',
  imports: [Button, ChoiceGroup],
  templateUrl: './challenge-panel.html',
  styleUrl: './challenge-panel.css',
})
export class ChallengePanel {
  protected readonly t = inject(Translator).t;
  protected readonly store = inject(Super3tStore);
  protected readonly run = inject(ChallengeRun);
  private readonly preferences = inject(Preferences);
  private readonly router = inject(Router);

  protected readonly progress = computed(() => judge(this.run.start(), this.store.game()));

  protected readonly options = computed((): readonly ChoiceOption<string>[] => {
    const c = this.t().challenge;
    const solved = this.preferences.solvedChallenges();
    return CHALLENGES.map((challenge) => ({
      value: challenge.id,
      label: c.levels[challenge.level] + (solved.has(challenge.id) ? c.solvedMark : ''),
    }));
  });

  /** One sentence on the attempt. */
  protected readonly message = computed((): string => {
    const c = this.t().challenge;
    const progress = this.progress();
    switch (progress.kind) {
      case 'find-key':
        return c.findKey;
      case 'defending':
        return c.defending;
      case 'finish':
        return c.finish;
      case 'saved':
        return c.saved(progress.reply.board + 1, progress.reply.cell + 1);
      case 'missed':
        return c.missed;
      case 'solved':
        return c.solved;
    }
  });

  /** The attempt went wrong: the board waits for a retry. */
  protected readonly failed = computed(() => ['saved', 'missed'].includes(this.progress().kind));

  /** The challenge after this one, offered once this one is solved. */
  protected readonly next = computed(() => {
    const index = CHALLENGES.findIndex((challenge) => challenge.id === this.run.challenge().id);
    return this.progress().kind === 'solved' ? CHALLENGES[index + 1] : undefined;
  });

  protected choose(id: string): void {
    void this.router.navigate(['/super-3t/challenge', id]);
  }

  protected retry(): void {
    this.store.newSeries();
  }
}
