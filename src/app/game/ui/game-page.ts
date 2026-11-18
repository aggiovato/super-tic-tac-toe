import { Component, computed, effect, inject } from '@angular/core';
import type { Player } from '@core';
import { Translator } from '@i18n';
import { GameStore, type Participant } from '@state';
import { DepartureBoard, type FlapTile } from './departure-board';
import { GameBoard } from './game-board';
import { injectMediaQuery } from './media-query';
import { SplitFlap } from './split-flap';

/** Below this width a cell would be under 44 px: boards are picked, then played zoomed. */
const COMPACT_QUERY = '(max-width: 34.99rem)';
const WORD_LENGTH = 6;

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');
const tile = (char: string, accent = false): FlapTile => ({ char, accent });
const word = (text: string): FlapTile[] =>
  [...text.padEnd(WORD_LENGTH).slice(0, WORD_LENGTH)].map((char) => tile(char));

/** The game route: departure row, board and series score. */
@Component({
  selector: 'app-game-page',
  imports: [DepartureBoard, GameBoard, SplitFlap],
  templateUrl: './game-page.html',
})
export class GamePage {
  protected readonly store = inject(GameStore);
  protected readonly translator = inject(Translator);
  protected readonly t = this.translator.t;

  constructor() {
    const compact = injectMediaQuery(COMPACT_QUERY);
    effect(() => this.store.setCompact(compact()));
  }

  /** Departure row: [player][arrow][destination…], or the result once the game ends. */
  protected readonly tiles = computed((): FlapTile[] => {
    const { status, target, turn } = this.store.game();
    const flap = this.t().flap;
    if (status.kind === 'won') {
      return [tile(status.winner, true), tile(' '), ...word(flap.wins)];
    }
    if (status.kind === 'drawn') {
      return [tile(' '), tile(' '), ...word(flap.draw)];
    }
    if (target.kind === 'forced') {
      return [tile(turn), tile('→'), tile(String(target.board), true), ...word('').slice(1)];
    }
    return [tile(turn), tile('→'), ...word(flap.free)];
  });

  /** One sentence explaining the row: why this board, or what a hovered cell would do. */
  protected readonly why = computed((): string => {
    const t = this.t();
    const { status, target, turn } = this.store.game();
    if (status.kind === 'won') {
      return t.won(status.winner);
    }
    if (status.kind === 'drawn') {
      return t.drawn;
    }
    const preview = this.store.previewTarget();
    if (preview !== undefined) {
      return t.preview(other(turn), preview);
    }
    const last = this.store.lastMove();
    if (!last) {
      return t.opening;
    }
    return target.kind === 'forced'
      ? t.forced(other(turn), last.cell, turn)
      : t.freeChoice(other(turn), last.cell, turn);
  });

  /** Announced once per change in the status region. */
  protected readonly status = computed((): string => {
    const t = this.t().status;
    const { status, target, turn } = this.store.game();
    if (status.kind === 'won') {
      return t.won(status.winner);
    }
    if (status.kind === 'drawn') {
      return t.drawn;
    }
    return target.kind === 'forced' ? t.forced(turn, target.board) : t.free(turn);
  });

  protected readonly score = computed(() => {
    const t = this.t();
    const wins = this.store.wins();
    const toMove = this.store.isOver() ? null : this.store.toMove();
    const digits = (value: number): string[] => [...String(Math.min(value, 99)).padStart(2, '0')];
    const player = (participant: Participant) => ({
      label: t.player(participant + 1, this.store.symbolOf(participant)),
      digits: digits(wins[participant]),
      active: toMove === participant,
    });
    return [
      player(0),
      { label: t.draws, digits: digits(this.store.draws()), active: false },
      player(1),
    ];
  });
}
