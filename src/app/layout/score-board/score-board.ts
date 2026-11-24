import { Component, computed, inject, input } from '@angular/core';
import type { Player } from '@tictac';
import { Translator } from '@i18n';
import { LevelBars, SplitFlap } from '@ui';
import { COMPUTER_LEVELS, gameById } from '@catalog';
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

  private readonly game = inject(ACTIVE_GAME);
  private readonly store = this.game.match;
  /** A game that cannot end in a draw (Ship Sink) shows no draws. */
  private readonly draws = computed(() => gameById(this.game.id).draws);
  private readonly preferences = inject(Preferences);
  protected readonly t = inject(Translator).t;

  /**
   * Who may move now, by participant: the player to move, or whoever the game's own rules say
   * (Ship Sink's placements: each player until their fleet is placed). Nobody is tagged while both
   * may move at once, or once the game is over.
   */
  private readonly mayMove = computed((): readonly [boolean, boolean] => {
    if (this.store.isOver()) return [false, false];
    const { rules } = gameById(this.game.id);
    const position = this.store.game();
    const may = (participant: Participant): boolean =>
      rules.mayMove
        ? rules.mayMove(position, this.store.symbolOf(participant))
        : this.store.toMove() === participant;
    const both: [boolean, boolean] = [may(0), may(1)];
    return both[0] && both[1] ? [false, false] : both;
  });

  /**
   * The tag's word: this device's player, the other side, or either of two people here. Online,
   * nothing until the room says which seat is this device's.
   */
  private turnWord(participant: Participant): string | null {
    const tag = this.t().turnTag;
    const mode = this.store.mode();
    if (mode === 'local') return tag.plays;
    const mine = mode === 'computer' ? 0 : this.store.seat();
    if (mine === null) return null;
    return participant === mine ? tag.yours : tag.theirs;
  }

  protected readonly entries = computed((): readonly ScoreEntry[] => {
    const t = this.t();
    const wins = this.store.wins();
    const names = this.preferences.names();
    const mayMove = this.mayMove();
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
      active: mayMove[participant],
      turn: mayMove[participant] ? this.turnWord(participant) : null,
    });
    if (!this.draws()) {
      return [player(0), player(1)];
    }
    return [
      player(0),
      {
        label: t.draws,
        glyph: null,
        digits: digits(this.store.draws()),
        active: false,
        turn: null,
        bars: null,
        levelName: null,
      },
      player(1),
    ];
  });
}
