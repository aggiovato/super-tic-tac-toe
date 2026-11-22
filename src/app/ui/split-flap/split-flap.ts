import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Preferences } from '@preferences';
import { drumPath } from './drum';

const STAGGER_MS = 35;

interface Face {
  readonly char: string;
  readonly accent: boolean;
}

/** A tile's way to its target: the faces it shows in order and how far along it is. */
interface Run {
  readonly path: readonly Face[];
  readonly step: number;
  readonly settled: boolean;
}

/**
 * One tile of a split-flap display. A new character is reached by cycling through the drum, each
 * step dropping the old top half and landing the new bottom half, staggered by `index` so a word
 * forms left to right. Reduced motion shows the new character at once. At rest the tile is drawn
 * as one face, with no seam.
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

  private readonly reducedMotion = inject(Preferences).reducedMotion;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly window = inject(DOCUMENT).defaultView;

  /**
   * Derived state: every new target (or spin) starts a run from the face currently shown. The
   * first render and reduced motion settle on the target at once.
   */
  private readonly run = linkedSignal<{ face: Face; spin: number }, Run>({
    source: () => ({ face: { char: this.char(), accent: this.accent() }, spin: this.spin() }),
    computation: (source, previous) => {
      const shown = previous ? previous.value.path[previous.value.step] : undefined;
      if (!shown || !previous || this.reducedMotion()) {
        return { path: [source.face], step: 0, settled: true };
      }
      const replay = source.spin !== previous.source.spin && source.spin !== 0;
      const chars = drumPath(replay ? ' ' : shown.char, source.face.char, this.maxSteps());
      const faces = chars.map((char, i) => ({
        char,
        accent: i === chars.length - 1 && source.face.accent,
      }));
      return { path: [shown, ...faces], step: 0, settled: false };
    },
  });

  protected readonly current = computed(() => {
    const { path, step } = this.run();
    return path[step] ?? { char: ' ', accent: false };
  });

  protected readonly previous = computed(() => {
    const { path, step } = this.run();
    return path[Math.max(0, step - 1)] ?? this.current();
  });

  /** While cycling the tile is drawn as two halves with falling leaves; at rest as one face. */
  protected readonly flipping = computed(() => !this.run().settled && this.run().step > 0);
  protected readonly step = computed(() => this.run().step);

  constructor() {
    // Drives the run with timers. It only schedules: the step advances in the timer callback.
    effect((onCleanup) => {
      const { path, step, settled } = this.run();
      if (settled) {
        return;
      }
      const last = step === path.length - 1;
      const wait = step === 0 ? this.index() * STAGGER_MS : this.stepMs();
      const timer = setTimeout(() => {
        this.run.update((run) =>
          last ? { ...run, settled: true } : { ...run, step: run.step + 1 },
        );
      }, wait);
      onCleanup(() => clearTimeout(timer));
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
