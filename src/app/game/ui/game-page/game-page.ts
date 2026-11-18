import { Component, computed, effect, inject } from '@angular/core';
import type { Player } from '@core';
import { Translator } from '@i18n';
import { Button, Icon, SplitFlap } from '@kit';
import { Preferences } from '@settings';
import { GameStore, type Participant } from '@state';
import { DepartureBoard, type FlapTile } from './departure-board';
import { GameBoard } from './game-board';
import { injectMediaQuery } from './media-query';
import { SettingsPanel } from './settings-panel';

/** Below this width a cell would be under 44 px: boards are picked, then played open. */
const COMPACT_QUERY = '(max-width: 34.99rem)';
const WORD_LENGTH = 5;
/** The result cascades through more characters than an ordinary turn. */
const RESULT_STEPS = 14;

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');
const glyph = (player: Player): string => (player === 'X' ? 'x' : 'o');
const word = (text: string, accent = false, steps?: number, length = WORD_LENGTH): FlapTile[] =>
  [...text.padEnd(length).slice(0, length)].map((char) => ({ char, accent, steps }));

/** The game route: departure row, board, series score and actions. */
@Component({
  selector: 'app-game-page',
  imports: [Button, DepartureBoard, GameBoard, Icon, SettingsPanel, SplitFlap],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage {
  protected readonly store = inject(GameStore);
  protected readonly t = inject(Translator).t;
  private readonly preferences = inject(Preferences);

  constructor() {
    const compact = injectMediaQuery(COMPACT_QUERY);
    effect(() => this.store.setCompact(compact()));
  }

  /** How a player is named in sentences: their custom name, otherwise their symbol. */
  private who(player: Player): string {
    const x = this.store.xPlayer();
    const participant: Participant = player === 'X' ? x : x === 0 ? 1 : 0;
    return this.preferences.names()[participant] || player;
  }

  /** Departure row: [player][arrow][destination…], or the result once the game ends. */
  protected readonly tiles = computed((): FlapTile[] => {
    const { status, target, turn } = this.store.game();
    const flap = this.t().flap;
    if (status.kind === 'won') {
      return [
        { char: glyph(status.winner), accent: true, steps: RESULT_STEPS },
        { char: ' ', accent: false },
        ...word(flap.wins, true, RESULT_STEPS),
      ];
    }
    if (status.kind === 'drawn') {
      // A draw has no player or arrow: the word takes the whole row.
      return word(flap.draw, true, RESULT_STEPS, WORD_LENGTH + 2);
    }
    const head: FlapTile[] = [
      { char: glyph(turn), accent: false },
      { char: '→', accent: false },
    ];
    if (target.kind === 'forced') {
      return [...head, { char: String(target.board + 1), accent: true }, ...word('').slice(1)];
    }
    return [...head, ...word(flap.free, true)];
  });

  /** One sentence for the row: a refused move, a preview, or why this board. */
  protected readonly why = computed((): string => {
    const t = this.t();
    const { status, target, turn } = this.store.game();
    const rejection = this.store.lastRejection();
    if (rejection) {
      return t.rejected(rejection, target.kind === 'forced' ? target.board + 1 : null);
    }
    if (status.kind === 'won') {
      return t.won(this.who(status.winner));
    }
    if (status.kind === 'drawn') {
      return t.drawn;
    }
    const preview = this.store.previewTarget();
    if (preview !== undefined) {
      return t.preview(this.who(other(turn)), preview === null ? null : preview + 1);
    }
    const last = this.store.lastMove();
    if (!last) {
      return t.opening;
    }
    const mover = this.who(other(turn));
    return target.kind === 'forced'
      ? t.forced(mover, last.cell + 1, this.who(turn))
      : t.freeChoice(mover, last.cell + 1, this.who(turn));
  });

  /** Announced once per change in the status region. */
  protected readonly status = computed((): string => {
    const t = this.t().status;
    const { status, target, turn } = this.store.game();
    if (status.kind === 'won') {
      return t.won(this.who(status.winner));
    }
    if (status.kind === 'drawn') {
      return t.drawn;
    }
    return target.kind === 'forced'
      ? t.forced(this.who(turn), target.board + 1)
      : t.free(this.who(turn));
  });

  protected readonly score = computed(() => {
    const t = this.t();
    const wins = this.store.wins();
    const names = this.preferences.names();
    const toMove = this.store.isOver() ? null : this.store.toMove();
    const digits = (value: number): string[] => [...String(Math.min(value, 99)).padStart(2, '0')];
    const player = (participant: Participant) => ({
      label: names[participant] || t.defaultName(participant + 1),
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

  protected readonly canUndo = computed(
    () => this.store.game().moves.length > 0 && !this.store.isOver(),
  );
}
