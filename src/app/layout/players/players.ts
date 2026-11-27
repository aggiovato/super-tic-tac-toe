import { Component, computed, inject, input } from '@angular/core';
import type { Player } from '@tictac';
import { Translator } from '@i18n';
import { LevelBars, SplitFlap } from '@ui';
import { COMPUTER_LEVELS, gameById } from '@catalog';
import { Preferences } from '@preferences';
import { type Participant, ACTIVE_GAME } from '@match';
import { playerLabel } from '../participant-name';
import type { PlayerCard, PlayerMarks, PlayerStat } from './players.model';

const glyph = (player: Player): 'x' | 'o' => (player === 'X' ? 'x' : 'o');
/** Two flap digits, capped at 99. */
const digits = (value: number): string[] => [...String(Math.min(value, 99)).padStart(2, '0')];

/**
 * The players of every game, one card each (and the draws between them in games that can end
 * drawn): who they are (the game's mark, their name, the computer's level), the game's own live
 * figure when it has one (Dots and Boxes: boxes, in each player's ink), their series wins, and the
 * turn tag on the player to move. The game says how it marks players and what its figure counts;
 * the mode says how players are named and what the tag reads.
 */
@Component({
  selector: 'app-players',
  imports: [SplitFlap, LevelBars],
  templateUrl: './players.html',
  styleUrl: './players.css',
  host: { '[class.compact]': 'compact() || !!stat()' },
})
export class Players {
  /** How the game marks its players: its symbol, the symbol in each player's ink, or nothing. */
  readonly marks = input<PlayerMarks>('symbol');
  /** The game's live figure per player, shown above the series; null when it has none. */
  readonly stat = input<PlayerStat | null>(null);
  /** A quieter series, where the game keeps its live figures elsewhere (Ship Sink's trains). */
  readonly compact = input(false);

  private readonly game = inject(ACTIVE_GAME);
  private readonly store = this.game.match;
  /** A game that cannot end in a draw shows no draws. */
  private readonly draws = computed(() => gameById(this.game.id).draws);
  private readonly preferences = inject(Preferences);
  protected readonly t = inject(Translator).t;

  /**
   * Who may move now, by participant: the player to move, or whoever the game's own rules say
   * (Ship Sink's placements: each player until their fleet is placed). Nobody is tagged while both
   * may move at once, while an online room waits for the other player, or once the game is over.
   */
  private readonly mayMove = computed((): readonly [boolean, boolean] => {
    if (this.store.isOver() || this.store.awaitingRival()) return [false, false];
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

  protected readonly cards = computed((): readonly PlayerCard[] => {
    const t = this.t();
    const wins = this.store.wins();
    const names = this.preferences.names();
    const mayMove = this.mayMove();
    const marks = this.marks();
    const stat = this.stat();
    const side = { mode: this.store.mode(), level: this.store.level(), seat: this.store.seat() };
    const computer = (participant: Participant) => side.mode === 'computer' && participant === 1;
    const player = (participant: Participant): PlayerCard => {
      const symbol = glyph(this.store.symbolOf(participant));
      return {
        label: playerLabel(t, names, side, participant),
        glyph: marks === 'none' ? null : symbol,
        ink: marks === 'ink' ? symbol : null,
        stat: stat
          ? { digits: digits(stat.values[participant]), spin: stat.spins?.[participant] ?? 0 }
          : null,
        bars: computer(participant) ? COMPUTER_LEVELS.indexOf(side.level) + 1 : null,
        levelName: computer(participant) ? t.settings.levels[side.level] : null,
        digits: digits(wins[participant]),
        active: mayMove[participant],
        turn: mayMove[participant] ? this.turnWord(participant) : null,
        draws: false,
      };
    };
    if (!this.draws()) {
      return [player(0), player(1)];
    }
    const drawn: PlayerCard = {
      label: t.draws,
      glyph: null,
      ink: null,
      stat: null,
      digits: digits(this.store.draws()),
      active: false,
      turn: null,
      bars: null,
      levelName: null,
      draws: true,
    };
    return [player(0), drawn, player(1)];
  });
}
