import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { GameId } from '@catalog';
import { Translator } from '@i18n';
import { Button } from '@ui';
import { OnlineRooms } from '../online-rooms';

/** "Invite someone online": creates a private room for this game and opens it. */
@Component({
  selector: 'app-online-start',
  imports: [Button],
  template: `
    <div class="grid gap-2">
      <button app-button="secondary" class="w-full" [disabled]="creating()" (click)="create()">
        {{ creating() ? t().online.creating : t().online.invite }}
      </button>
      <p class="text-caption" [class.text-target]="failed()" aria-live="polite">
        {{ failed() ? t().online.createFailed : t().online.inviteHint }}
      </p>
    </div>
  `,
})
export class OnlineStart {
  readonly gameId = input.required<GameId>();
  readonly variant = input('');
  /** The room is ready and its route is opening (the sheet closes). */
  readonly opened = output();

  protected readonly t = inject(Translator).t;
  private readonly rooms = inject(OnlineRooms);
  private readonly router = inject(Router);

  protected readonly creating = signal(false);
  protected readonly failed = signal(false);

  protected async create(): Promise<void> {
    this.creating.set(true);
    this.failed.set(false);
    try {
      const roomId = await this.rooms.create(this.gameId(), this.variant());
      this.opened.emit();
      await this.router.navigate(['/', this.gameId(), 'online', roomId]);
    } catch (error) {
      console.error('The room could not be created.', error);
      this.failed.set(true);
    } finally {
      this.creating.set(false);
    }
  }
}
