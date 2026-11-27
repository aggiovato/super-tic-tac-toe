import { Component, computed, inject } from '@angular/core';
import type { Player } from '@dots/core';
import { DotsStore } from '@dots/state';
import { Translator } from '@i18n';
import { DepartureBoard, type FlapTile } from '@ui';
import type { Participant } from '@match';
import { Preferences } from '@preferences';
import { participantName } from '@layout';

const WORD_LENGTH = 5;
/** The result cascades through more characters than an ordinary turn. */
const RESULT_STEPS = 14;

const glyph = (player: Player): string => (player === 'X' ? 'x' : 'o');
const word = (text: string, accent = false, steps?: number, length = WORD_LENGTH): FlapTile[] =>
  [...text.padEnd(length).slice(0, length)].map((char) => ({ char, accent, steps }));

/**
 * The Dots and Boxes status: a departure row (who draws next, in their ink, or the result), one
 * sentence on the last line, and the status region screen readers hear (the boxes each player
 * holds are on their cards).
 */
@Component({
  selector: 'app-dots-status',
  imports: [DepartureBoard],
  templateUrl: './dots-status.html',
  styleUrl: './dots-status.css',
})
export class DotsStatus {
  protected readonly store = inject(DotsStore);
  protected readonly t = inject(Translator).t;
  /** Who plays: the opponent is named after its level. */
  private readonly side = computed(() => ({
    mode: this.store.mode(),
    level: this.store.level(),
    seat: this.store.seat(),
  }));
  private readonly preferences = inject(Preferences);

  private who(player: Player): string {
    const x = this.store.xPlayer();
    const participant: Participant = player === 'X' ? x : x === 0 ? 1 : 0;
    return participantName(this.t(), this.preferences.names(), this.side(), participant) ?? player;
  }

  protected readonly tiles = computed((): FlapTile[] => {
    const { status, turn } = this.store.game();
    const flap = this.t().flap;
    if (status.kind === 'won') {
      // The win in Apricot, as on the board and in Super 3T.
      return [
        { char: glyph(status.winner), accent: true, steps: RESULT_STEPS },
        { char: ' ', accent: false },
        ...word(flap.wins, true, RESULT_STEPS),
      ];
    }
    if (status.kind === 'drawn') {
      // Nobody won: plain flaps (Apricot marks only the winning figure).
      return word(flap.draw, false, RESULT_STEPS, WORD_LENGTH + 2);
    }
    // Who draws next, in their ink (the boxes are on the players' cards); every free line is
    // where they may draw, as every free cell in the classic game.
    const ink = glyph(turn) as 'x' | 'o';
    const last = this.store.lastLine();
    const again = last !== null && last.closed > 0 && last.mover === turn;
    return [
      { char: ink, accent: false, ink, ...(again ? { spin: this.store.game().moves.length } : {}) },
      { char: '→', accent: false },
      ...word(this.t().dots.flapTurn, true),
    ];
  });

  /** One sentence: a refused line, the result, or what the last line did. */
  protected readonly why = computed((): string => {
    const d = this.t().dots;
    const game = this.store.game();
    const rejection = this.store.lastRejection();
    if (rejection) {
      return d.rejected(rejection);
    }
    if (game.status.kind === 'won') {
      const { winner } = game.status;
      return d.won(this.who(winner), game.score[winner], game.score[winner === 'X' ? 'O' : 'X']);
    }
    if (game.status.kind === 'drawn') {
      return d.drawn;
    }
    const last = this.store.lastLine();
    if (!last) {
      return d.opening;
    }
    return last.closed > 0
      ? d.closed(this.who(last.mover), last.closed)
      : d.drew(this.who(last.mover), this.who(game.turn));
  });

  /**
   * What screen readers hear after every change: what the last line did, the boxes each holds, and
   * whose turn it is (or the result). Boxes are hidden from them, so the count is said here.
   */
  protected readonly status = computed((): string => {
    const d = this.t().dots;
    const { status, turn } = this.store.game();
    const { X, O } = this.store.boxes();
    const tally = d.tallyStatus(X, O);
    if (status.kind === 'won') {
      return `${this.why()} ${tally} ${d.status.won(this.who(status.winner))}`;
    }
    if (status.kind === 'drawn') {
      return `${this.why()} ${tally} ${d.status.drawn}`;
    }
    return this.store.lastLine()
      ? `${this.why()} ${tally}`
      : `${tally} ${d.status.turn(this.who(turn))}`;
  });
}
