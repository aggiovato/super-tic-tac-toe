import { Component, computed, inject } from '@angular/core';
import { ClassicStore } from '@classic/state';
import { Translator } from '@i18n';
import { DepartureBoard, type FlapTile } from '@kit';
import type { Participant } from '@match';
import { Preferences } from '@settings';
import { participantName } from '@shell';
import type { Player } from '@tictac';

const WORD_LENGTH = 5;
/** The result cascades through more characters than an ordinary turn. */
const RESULT_STEPS = 14;

const glyph = (player: Player): string => (player === 'X' ? 'x' : 'o');
const word = (text: string, accent = false, steps?: number, length = WORD_LENGTH): FlapTile[] =>
  [...text.padEnd(length).slice(0, length)].map((char) => ({ char, accent, steps }));

/**
 * The classic game's status: a departure row (who plays, or the result), one sentence on the last
 * move, and the status region that announces each change to screen readers.
 */
@Component({
  selector: 'app-classic-status',
  imports: [DepartureBoard],
  templateUrl: './classic-status.html',
  styleUrl: './classic-status.css',
})
export class ClassicStatus {
  protected readonly store = inject(ClassicStore);
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);

  /** How a player is named in sentences: their custom name, otherwise their symbol. */
  private who(player: Player): string {
    const x = this.store.xPlayer();
    const participant: Participant = player === 'X' ? x : x === 0 ? 1 : 0;
    return (
      participantName(this.t(), this.preferences.names(), this.store.mode(), participant) ?? player
    );
  }

  protected readonly tiles = computed((): FlapTile[] => {
    const { status, turn } = this.store.game();
    const flap = this.t().flap;
    if (status.kind === 'won') {
      return [
        { char: glyph(status.winner), accent: true, steps: RESULT_STEPS },
        { char: ' ', accent: false },
        ...word(flap.wins, true, RESULT_STEPS),
      ];
    }
    if (status.kind === 'drawn') {
      return word(flap.draw, true, RESULT_STEPS, WORD_LENGTH + 2);
    }
    return [
      { char: glyph(turn), accent: false },
      { char: '→', accent: false },
      ...word(this.t().classic.flapTurn, true),
    ];
  });

  /** One sentence: a refused move, the result, or the last move and whose turn it is. */
  protected readonly why = computed((): string => {
    const c = this.t().classic;
    const { status, turn, moves } = this.store.game();
    const rejection = this.store.lastRejection();
    if (rejection) {
      return c.rejected(rejection);
    }
    if (status.kind === 'won') {
      return c.won(this.who(status.winner));
    }
    if (status.kind === 'drawn') {
      return c.drawn;
    }
    const last = moves.at(-1);
    return last
      ? c.played(this.who(turn === 'X' ? 'O' : 'X'), last.cell + 1, this.who(turn))
      : c.opening;
  });

  /** What screen readers hear after every change. */
  protected readonly status = computed((): string => {
    const s = this.t().classic.status;
    const { status, turn } = this.store.game();
    if (status.kind === 'won') {
      return s.won(this.who(status.winner));
    }
    return status.kind === 'drawn' ? s.drawn : s.turn(this.who(turn));
  });
}
