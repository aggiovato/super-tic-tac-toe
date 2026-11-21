import { Component, computed, inject } from '@angular/core';
import type { Player } from '@tictac';
import { Translator } from '@i18n';
import { SplitFlap } from '@kit';
import { Preferences } from '@settings';
import type { Participant } from '@match';
import { ACTIVE_GAME } from '../active-game';
import { participantName } from '../participant-name';
import type { ScoreEntry } from './score-entry.model';

const glyph = (player: Player): string => (player === 'X' ? 'x' : 'o');
/** Two flap digits, capped at 99. */
const digits = (value: number): string[] => [...String(Math.min(value, 99)).padStart(2, '0')];

/** The series score: each player's wins and the draws, in flap digits; the player to move stands out. */
@Component({
  selector: 'app-score-board',
  imports: [SplitFlap],
  templateUrl: './score-board.html',
  styleUrl: './score-board.css',
})
export class ScoreBoard {
  private readonly store = inject(ACTIVE_GAME).match;
  private readonly preferences = inject(Preferences);
  protected readonly t = inject(Translator).t;

  protected readonly entries = computed((): readonly ScoreEntry[] => {
    const t = this.t();
    const wins = this.store.wins();
    const names = this.preferences.names();
    const toMove = this.store.isOver() ? null : this.store.toMove();
    const player = (participant: Participant): ScoreEntry => ({
      label:
        participantName(t, names, this.store.mode(), participant) ?? t.defaultName(participant + 1),
      glyph: glyph(this.store.symbolOf(participant)),
      digits: digits(wins[participant]),
      active: toMove === participant,
    });
    return [
      player(0),
      { label: t.draws, glyph: null, digits: digits(this.store.draws()), active: false },
      player(1),
    ];
  });
}
