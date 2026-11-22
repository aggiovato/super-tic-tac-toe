import { Component, computed, inject, input } from '@angular/core';
import type { Player } from '@tictac';
import { Translator } from '@i18n';
import { LevelBars, SplitFlap } from '@kit';
import { OPPONENT_LEVELS, Preferences } from '@settings';
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
    const side = { mode: this.store.mode(), level: this.store.level() };
    const computer = (participant: Participant) => side.mode === 'opponent' && participant === 1;
    const player = (participant: Participant): ScoreEntry => ({
      label: participantName(t, names, side, participant) ?? t.defaultName(participant + 1),
      bars: computer(participant) ? OPPONENT_LEVELS.indexOf(side.level) + 1 : null,
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
