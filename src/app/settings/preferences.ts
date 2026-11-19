import { computed, DestroyRef, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import type {
  Design,
  MotionSetting,
  OpponentLevel,
  PlayMode,
  PreferencesState,
} from './preferences.model';

export const DESIGNS: readonly Design[] = ['departures', 'departures-contrast'];
export const NAME_MAX_LENGTH = 16;
export const PLAY_MODES: readonly PlayMode[] = ['humans', 'opponent'];
export const OPPONENT_LEVELS: readonly OpponentLevel[] = ['beginner', 'intermediate'];

const STORAGE_KEY = 'super-ttt.preferences';

const isDesign = (value: unknown): value is Design => DESIGNS.some((design) => design === value);
const isMode = (value: unknown): value is PlayMode => PLAY_MODES.some((mode) => mode === value);
const isLevel = (value: unknown): value is OpponentLevel =>
  OPPONENT_LEVELS.some((level) => level === value);
const DEFAULTS: PreferencesState = {
  names: ['', ''],
  motion: 'system',
  autoZoom: true,
  hints: true,
  design: 'departures',
  mode: 'humans',
  level: 'beginner',
};

/**
 * Per-player conveniences, kept in this browser only. Applies the design and motion setting to
 * `<html>` (`data-theme`, `data-motion`) so CSS and components follow them.
 */
@Injectable({ providedIn: 'root' })
export class Preferences {
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<PreferencesState>(this.load());

  readonly names = computed(() => this.state().names);
  readonly motion = computed(() => this.state().motion);
  readonly autoZoom = computed(() => this.state().autoZoom);
  readonly hints = computed(() => this.state().hints);
  readonly design = computed(() => this.state().design);
  readonly mode = computed(() => this.state().mode);
  readonly level = computed(() => this.state().level);

  private readonly systemReducedMotion = signal(false);

  /** Whether motion should be skipped right now, from the setting or, by default, the system. */
  readonly reducedMotion = computed(() => {
    const motion = this.motion();
    return motion === 'reduced' || (motion === 'system' && this.systemReducedMotion());
  });

  constructor() {
    const query = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      this.systemReducedMotion.set(query.matches);
      const update = (event: MediaQueryListEvent): void =>
        this.systemReducedMotion.set(event.matches);
      query.addEventListener('change', update);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
    }

    effect(() => {
      const root = this.document.documentElement;
      root.dataset['theme'] = this.design();
      if (this.motion() === 'system') {
        delete root.dataset['motion'];
      } else {
        root.dataset['motion'] = this.motion();
      }
    });
  }

  setName(index: 0 | 1, name: string): void {
    const names: [string, string] = [...this.state().names];
    names[index] = name.slice(0, NAME_MAX_LENGTH);
    this.update({ names });
  }

  setMotion(motion: MotionSetting): void {
    this.update({ motion });
  }

  setAutoZoom(autoZoom: boolean): void {
    this.update({ autoZoom });
  }

  setHints(hints: boolean): void {
    this.update({ hints });
  }

  setDesign(design: Design): void {
    this.update({ design });
  }

  setMode(mode: PlayMode): void {
    this.update({ mode });
  }

  setLevel(level: OpponentLevel): void {
    this.update({ level });
  }

  private update(change: Partial<PreferencesState>): void {
    this.state.update((state) => ({ ...state, ...change }));
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
    } catch {
      // Storage may be blocked (private mode); the preference then lasts for this visit only.
    }
  }

  private load(): PreferencesState {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return DEFAULTS;
      }
      const saved = JSON.parse(raw) as Partial<PreferencesState>;
      const names = Array.isArray(saved.names) ? saved.names : DEFAULTS.names;
      return {
        names: [
          String(names[0] ?? '').slice(0, NAME_MAX_LENGTH),
          String(names[1] ?? '').slice(0, NAME_MAX_LENGTH),
        ],
        motion: saved.motion === 'full' || saved.motion === 'reduced' ? saved.motion : 'system',
        autoZoom: saved.autoZoom ?? DEFAULTS.autoZoom,
        hints: saved.hints ?? DEFAULTS.hints,
        design: isDesign(saved.design) ? saved.design : DEFAULTS.design,
        mode: isMode(saved.mode) ? saved.mode : DEFAULTS.mode,
        level: isLevel(saved.level) ? saved.level : DEFAULTS.level,
      };
    } catch {
      return DEFAULTS;
    }
  }
}
