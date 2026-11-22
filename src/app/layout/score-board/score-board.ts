import { Component, computed, inject, input } from '@angular/core';
import type { Player } from '@tictac';
import { Translator } from '@i18n';
import { LevelBars, SplitFlap } from '@ui';
import { COMPUTER_LEVELS } from '@catalog';
import { Preferences } from '@preferences';
import { type Participant, ACTIVE_GAME } from '@match';
import { participantName } from '../participant-name';
import type { ScoreEntry } from './score-entry.model';

const glyph = (player: Player): string => (player === 'X' ? 'x' : 'o');
/** Two flap digits, capped at 99. */
const digits = (value: number): string[] => [...String(Math.min(value, 99)).padStart(2, '0')];

/** The series score: each player's wins and the draws, in flap digits; the player to move stands out. */
@Component({
  selector: 'app-score-board',
  imports: [SplitFlap, LevelBars],
  templateUrl: './score-board.html',
  styleUrl: './score-board.css',
  host: { '[class.compact]': 'compact()' },
})
export class ScoreBoard {
  /** A quieter series score, where the game shows its own score above (Dots and Boxes). */
  readonly compact = input(false);

  private readonly store = inject(ACTIVE_GAME).match;
  private readonly preferences = inject(Preferences);
  protected readonly t = inject(Translator).t;

  protected readonly entries = computed((): readonly ScoreEntry[] => {
    const t = this.t();
    const wins = this.store.wins();
    const names = this.preferences.names();
    const toMove = this.store.isOver() ? null : this.store.toMove();
    const side = { mode: this.store.mode(), level: this.store.level(), seat: this.store.seat() };
    const computer = (participant: Participant) => side.mode === 'computer' && participant === 1;
    const player = (participant: Participant): ScoreEntry => ({
      label:
        side.mode === 'online'
          ? side.seat === null
            ? t.defaultName(participant + 1)
            : (participantName(t, names, side, participant) ??
              (participant === side.seat ? t.online.you : t.online.rival))
          : (participantName(t, names, side, participant) ?? t.defaultName(participant + 1)),
      bars: computer(participant) ? COMPUTER_LEVELS.indexOf(side.level) + 1 : null,
      levelName: computer(participant) ? t.settings.levels[side.level] : null,
      glyph: glyph(this.store.symbolOf(participant)),
      digits: digits(wins[participant]),
      active: toMove === participant,
    });
    return [
      player(0),
      {
        label: t.draws,
        glyph: null,
        digits: digits(this.store.draws()),
        active: false,
        bars: null,
        levelName: null,
      },
      player(1),
    ];
  });
}
