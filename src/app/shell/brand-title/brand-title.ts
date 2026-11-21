import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { SplitFlap } from '@kit';

/** The name read with its two flaps: T·IP, T·AP, T·OE. */
const ENDINGS = ['IP', 'AP', 'OE'] as const;
/** Blank flaps: what they turn to before folding away. */
const REST = '  ';
/** Time each ending stays up, travel included, before the flaps turn to the next one. */
const ENDING_MS = 1000;
/** The last ending holds a little longer before the flaps clear. */
const LAST_HOLD_MS = 1400;
/** Time for the flaps to turn blank before they fold away. */
const CLEAR_MS = 450;
/** Fewest drum characters each flap cycles through on its way to a letter. */
const FLAP_STEPS = 5;

/**
 * The app's name: the word "Super" followed by the 3T mark, which stands for "3T" (its alt text, so
 * the heading reads "Super 3T"). Each time `wonBoards` grows (a game's boards won), two split-flap
 * tiles unfold right
 * after the mark's T, as two more tiles of the same board, and spell the three words the name
 * stands for (TIP, TAP, TOE), then turn blank and fold away. They stay in the DOM while hidden, so
 * they flip from blank instead of popping in.
 */
@Component({
  selector: 'app-brand-title',
  imports: [SplitFlap],
  styleUrl: './brand-title.css',
  template: `
    <h1 class="brand">
      Super
      <img class="mark" src="icons/mark-small.svg" alt="3T" width="40" height="40" />
      <span class="flaps" [class.shown]="shown()" aria-hidden="true">
        @for (char of letters(); track $index) {
          <app-split-flap [char]="char" [index]="$index" [maxSteps]="flapSteps" />
        }
      </span>
    </h1>
  `,
})
export class BrandTitle {
  protected readonly flapSteps = FLAP_STEPS;
  private readonly ending = signal<string>(REST);
  protected readonly shown = signal(false);
  protected readonly letters = computed(() => [...this.ending()]);

  /** Boards won in the current game (draws do not count); the endings play when it grows. */
  readonly wonBoards = input(0);

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    // The count a game is shown with (a resumed one, a rematch) is the baseline, not a closing.
    let seen = untracked(this.wonBoards);
    // Drives timers only: the flaps change in the timer callbacks.
    effect(() => {
      const won = this.wonBoards();
      const grew = won > seen;
      seen = won;
      if (grew) {
        untracked(() => this.play());
      }
    });
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  /** Unfold, TIP, TAP, TOE, blank, fold away; another board won meanwhile starts over. */
  private play(): void {
    this.clear();
    this.shown.set(true);
    const cleared = (ENDINGS.length - 1) * ENDING_MS + LAST_HOLD_MS;
    this.timers = [
      ...ENDINGS.map((ending, i) => setTimeout(() => this.ending.set(ending), i * ENDING_MS)),
      setTimeout(() => this.ending.set(REST), cleared),
      setTimeout(() => this.shown.set(false), cleared + CLEAR_MS),
    ];
  }

  private clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }
}
