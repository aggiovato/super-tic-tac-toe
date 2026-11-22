import { computed, DestroyRef, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import type {
  Design,
  GameId,
  MotionSetting,
  OpponentLevel,
  PlayMode,
  PlaySetup,
  PreferencesState,
} from './preferences.model';

export const DESIGNS: readonly Design[] = ['departures', 'departures-contrast'];
export const NAME_MAX_LENGTH = 16;
export const PLAY_MODES: readonly PlayMode[] = ['humans', 'opponent'];
export const OPPONENT_LEVELS: readonly OpponentLevel[] = ['beginner', 'intermediate', 'advanced'];
export const GAME_IDS: readonly GameId[] = ['super-3t', 'classic', 'dots'];

const STORAGE_KEY = 'super-ttt.preferences';

const isDesign = (value: unknown): value is Design => DESIGNS.some((design) => design === value);
const isMode = (value: unknown): value is PlayMode => PLAY_MODES.some((mode) => mode === value);
const isLevel = (value: unknown): value is OpponentLevel =>
  OPPONENT_LEVELS.some((level) => level === value);
const isGame = (value: unknown): value is GameId => GAME_IDS.some((game) => game === value);
const TWO_PEOPLE: PlaySetup = { mode: 'humans', level: 'beginner' };

/** A saved setup, or the default for what is missing or unknown. */
function readSetup(saved: Partial<PlaySetup> | undefined): PlaySetup {
  return {
    mode: isMode(saved?.mode) ? saved.mode : TWO_PEOPLE.mode,
    level: isLevel(saved?.level) ? saved.level : TWO_PEOPLE.level,
    ...(typeof saved?.variant === 'string' ? { variant: saved.variant } : {}),
  };
}

/** Two names, each cut to the allowed length. */
function readNames(saved: unknown): [string, string] {
  const names: unknown[] = Array.isArray(saved) ? saved : [];
  const read = (name: unknown): string =>
    typeof name === 'string' ? name.slice(0, NAME_MAX_LENGTH) : '';
  return [read(names[0]), read(names[1])];
}

/** A list of ids, keeping only strings. */
const readIds = (saved: unknown): string[] =>
  Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];

/** Games whose tutorial was seen; older versions kept one flag, Super 3T's. */
function readTutorials(saved: Partial<PreferencesState> & LegacyPreferences): GameId[] {
  const games = Array.isArray(saved.seenTutorials) ? saved.seenTutorials.filter(isGame) : [];
  return saved.tutorialSeen === true && !games.includes('super-3t')
    ? [...games, 'super-3t']
    : games;
}

/** What older versions stored: one mode and level, Super 3T's, before there were several games. */
interface LegacyPreferences {
  readonly mode?: unknown;
  readonly level?: unknown;
  readonly tutorialSeen?: unknown;
}
const DEFAULTS: PreferencesState = {
  names: ['', ''],
  motion: 'system',
  autoZoom: true,
  hints: true,
  libraryShown: true,
  design: 'departures',
  play: { 'super-3t': TWO_PEOPLE, classic: TWO_PEOPLE, dots: TWO_PEOPLE },
  lastGame: 'super-3t',
  seenTutorials: [],
  solvedChallenges: [],
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
  readonly libraryShown = computed(() => this.state().libraryShown);
  readonly design = computed(() => this.state().design);
  readonly play = computed(() => this.state().play);
  readonly lastGame = computed(() => this.state().lastGame);
  readonly seenTutorials = computed(() => new Set(this.state().seenTutorials));
  readonly solvedChallenges = computed(() => new Set(this.state().solvedChallenges));

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

  setLibraryShown(libraryShown: boolean): void {
    this.update({ libraryShown });
  }

  setDesign(design: Design): void {
    this.update({ design });
  }

  /** Who plays `game` from now on. */
  setPlay(game: GameId, setup: PlaySetup): void {
    // A setup without a variant keeps the one already chosen.
    const merged = { ...this.state().play[game], ...setup };
    this.update({ play: { ...this.state().play, [game]: merged } });
  }

  /** The game the app opens on next time. */
  setLastGame(game: GameId): void {
    if (this.state().lastGame !== game) {
      this.update({ lastGame: game });
    }
  }

  /** Records a solved challenge once: solving it again changes nothing. */
  markChallengeSolved(id: string): void {
    if (!this.solvedChallenges().has(id)) {
      this.update({ solvedChallenges: [...this.state().solvedChallenges, id] });
    }
  }

  markTutorialSeen(game: GameId): void {
    if (!this.seenTutorials().has(game)) {
      this.update({ seenTutorials: [...this.state().seenTutorials, game] });
    }
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
      const saved = JSON.parse(raw) as Partial<PreferencesState> & LegacyPreferences;
      const play = saved.play as Partial<Record<GameId, Partial<PlaySetup>>> | undefined;
      return {
        names: readNames(saved.names),
        motion: saved.motion === 'full' || saved.motion === 'reduced' ? saved.motion : 'system',
        autoZoom: saved.autoZoom ?? DEFAULTS.autoZoom,
        hints: saved.hints ?? DEFAULTS.hints,
        libraryShown:
          typeof saved.libraryShown === 'boolean' ? saved.libraryShown : DEFAULTS.libraryShown,
        design: isDesign(saved.design) ? saved.design : DEFAULTS.design,
        play: {
          // Before several games, `mode` and `level` were Super 3T's: they move into its setup.
          'super-3t': readSetup(play?.['super-3t'] ?? (saved as Partial<PlaySetup>)),
          classic: readSetup(play?.classic),
          dots: readSetup(play?.dots),
        },
        lastGame: isGame(saved.lastGame) ? saved.lastGame : DEFAULTS.lastGame,
        seenTutorials: readTutorials(saved),
        solvedChallenges: readIds(saved.solvedChallenges),
      };
    } catch {
      return DEFAULTS;
    }
  }
}
