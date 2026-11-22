import type { GameState, Move } from '@dots/core';

/**
 * A mutable copy of a position for searching: lines by index (horizontals first, then verticals),
 * how many sides of each box are drawn, and how many lines are left. `draw` and `erase` are exact
 * inverses, so a search walks the tree without copying.
 */
export class Board {
  readonly lines: number;
  readonly drawn: Uint8Array;
  readonly sides: Uint8Array;
  /** The boxes beside each line: one on the edge, two inside. */
  readonly beside: readonly (readonly number[])[];
  remaining: number;
  private readonly horizontals: number;

  constructor(
    readonly size: number,
    state?: GameState,
  ) {
    this.horizontals = (size + 1) * size;
    this.lines = 2 * this.horizontals;
    this.drawn = new Uint8Array(this.lines);
    this.sides = new Uint8Array(size * size);
    this.beside = Array.from({ length: this.lines }, (_, line) => this.boxesOf(line));
    this.remaining = this.lines;
    if (state) {
      [...state.h, ...state.v].forEach((owner, line) => owner && this.draw(line));
    }
  }

  /** Draws `line` and returns how many boxes it closed. */
  draw(line: number): number {
    this.drawn[line] = 1;
    this.remaining -= 1;
    let closed = 0;
    for (const box of this.beside[line]) {
      const sides = this.sides[box] + 1;
      this.sides[box] = sides;
      closed += sides === 4 ? 1 : 0;
    }
    return closed;
  }

  erase(line: number): void {
    this.drawn[line] = 0;
    this.remaining += 1;
    for (const box of this.beside[line]) {
      this.sides[box] = this.sides[box] - 1;
    }
  }

  /** Lines still to draw. */
  open(): number[] {
    const open: number[] = [];
    this.drawn.forEach((drawn, line) => drawn || open.push(line));
    return open;
  }

  /** How many boxes drawing `line` would close now. */
  closes(line: number): number {
    return this.beside[line].filter((box) => this.sides[box] === 3).length;
  }

  /** Whether drawing `line` closes nothing and gives the opponent no box (no third side). */
  safe(line: number): boolean {
    return this.beside[line].every((box) => this.sides[box] < 2);
  }

  /** The drawn lines as a key: a position's future does not depend on who drew what. */
  key(): string {
    return this.drawn.join('');
  }

  move(line: number): Move {
    const { size } = this;
    if (line < this.horizontals) {
      return { orientation: 'h', row: Math.floor(line / size), col: line % size };
    }
    const index = line - this.horizontals;
    return { orientation: 'v', row: Math.floor(index / (size + 1)), col: index % (size + 1) };
  }

  private boxesOf(line: number): number[] {
    const { orientation, row, col } = this.move(line);
    const size = this.size;
    if (orientation === 'h') {
      return [row - 1, row].filter((r) => r >= 0 && r < size).map((r) => r * size + col);
    }
    return [col - 1, col].filter((c) => c >= 0 && c < size).map((c) => row * size + c);
  }
}
