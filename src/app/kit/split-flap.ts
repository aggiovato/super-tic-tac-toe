import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Preferences } from '@settings';

/**
 * Letters and digits on the drum, in order. A tile cycles through these on its way to a new
 * character. Glyphs (`x` and `o` for the players, drawn as the board's marks so they never read as a
 * letter or a zero; `→`; `=`) are never cycled through: they only appear as the final character.
 */
const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ0123456789';
const STAGGER_MS = 35;

interface Face {
  readonly char: string;
  readonly accent: boolean;
}

/** Characters shown on the way from `from` to `to`, ending on `to`, at most `max` long. */
function drumPath(from: string, to: string, max: number): string[] {
  const start = Math.max(0, DRUM.indexOf(from));
  const end = DRUM.indexOf(to);
  const steps = Math.max(1, max);
  if (end < 0) {
    // A glyph: spin a few drum characters, then land on it.
    return [
      ...Array.from({ length: steps - 1 }, (_, i) => DRUM[(start + i + 1) % DRUM.length] ?? ' '),
      to,
    ];
  }
  const distance = (end - start + DRUM.length) % DRUM.length;
  const count = Math.min(Math.max(distance, 1), steps);
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? to : (DRUM[(end - (count - 1 - i) + DRUM.length) % DRUM.length] ?? to),
  );
}

/**
 * One tile of a split-flap display. A new character is reached by cycling through the drum, each
 * step dropping the old top half and landing the new bottom half, staggered by `index` so a word
 * forms left to right. Reduced motion shows the new character at once.
 */
@Component({
  selector: 'app-split-flap',
  imports: [NgTemplateOutlet],
  templateUrl: './split-flap.html',
  styleUrl: './split-flap.css',
  host: { 'aria-hidden': 'true' },
})
export class SplitFlap {
  readonly char = input.required<string>();
  readonly accent = input(false);
  /** Position in its row; delays the start so the row reads left to right. */
  readonly index = input(0);
  /** Most intermediate characters shown on the way to a new one. */
  readonly maxSteps = input(6);
  /** Changing it replays the cycle from blank, e.g. when a board becomes the destination. */
  readonly spin = input(0);

  private readonly preferences = inject(Preferences);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly current = signal<Face>({ char: ' ', accent: false });
  protected readonly previous = signal<Face>({ char: ' ', accent: false });
  /** Increments on every step so the falling leaves are recreated and animate again. */
  protected readonly flip = signal(0);

  private initialised = false;
  private lastSpin = 0;

  constructor() {
    effect((onCleanup) => {
      const target: Face = { char: this.char(), accent: this.accent() };
      const spin = this.spin();
      const reduced = this.preferences.reducedMotion();

      untracked(() => {
        const replay = spin !== this.lastSpin;
        this.lastSpin = spin;
        if (!this.initialised || reduced) {
          this.initialised = true;
          this.previous.set(target);
          this.current.set(target);
          return;
        }
        const from = replay ? ' ' : this.current().char;
        const path = drumPath(from, target.char, this.maxSteps());
        const step = this.stepMs();
        const delay = this.index() * STAGGER_MS;
        const timers = path.map((char, i) =>
          setTimeout(
            () => {
              this.previous.set(this.current());
              this.current.set({ char, accent: i === path.length - 1 && target.accent });
              this.flip.update((n) => n + 1);
            },
            delay + i * step,
          ),
        );
        onCleanup(() => timers.forEach(clearTimeout));
      });
    });
  }

  /** Duration of one character step, read from the `--duration-step` token. */
  private stepMs(): number {
    const value = this.window
      ?.getComputedStyle(this.host.nativeElement)
      .getPropertyValue('--duration-step');
    return Number.parseFloat(value ?? '') || 60;
  }
}
