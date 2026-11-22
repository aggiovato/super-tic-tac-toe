import {
  DestroyRef,
  DOCUMENT,
  type EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  provideAppInitializer,
  signal,
} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** Reloads the page; a token so tests can watch it instead of reloading. */
export const RELOAD_PAGE = new InjectionToken<() => void>('RELOAD_PAGE', {
  providedIn: 'root',
  factory: () => {
    const location = inject(DOCUMENT).location;
    return () => location.reload();
  },
});

/** Creates `AppUpdates` when the app starts, so it hears every event of the service worker. */
export function provideAppUpdates(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(AppUpdates);
  });
}

/** How often an app left open asks for a new version. */
export const UPDATE_CHECK_MS = 30 * 60 * 1000;

/**
 * New releases of the installed app. Created when the app starts (`provideAppUpdates`), so no
 * event of the service worker is missed. It asks for a new version at start, every half hour while
 * the app is open and whenever it comes back to the foreground; once one is downloaded, `ready`
 * turns true and `UpdateNotice` offers it after the game is saved. A cached version the worker can
 * no longer serve is `broken`: the page reloads as soon as no save is under way. Without a service
 * worker (development, tests) nothing ever changes.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdates {
  /** Absent where the app runs without `provideServiceWorker` (tests): nothing to update then. */
  private readonly updates = inject(SwUpdate, { optional: true });
  private readonly reloadPage = inject(RELOAD_PAGE);
  private readonly readySignal = signal(false);
  private readonly brokenSignal = signal(false);

  /** A new version is downloaded: the player may switch to it. */
  readonly ready = this.readySignal.asReadonly();
  /** The running version can no longer load its files: a reload is due at once. */
  readonly broken = this.brokenSignal.asReadonly();

  constructor() {
    const updates = this.updates;
    if (!updates?.isEnabled) {
      return;
    }
    const versions = updates.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.readySignal.set(true);
      }
    });
    const broken = updates.unrecoverable.subscribe(() => this.brokenSignal.set(true));
    const document = inject(DOCUMENT);
    const check = (): void => {
      if (document.visibilityState === 'visible') {
        updates.checkForUpdate().catch(() => undefined);
      }
    };
    check();
    const timer = setInterval(check, UPDATE_CHECK_MS);
    document.addEventListener('visibilitychange', check);
    inject(DestroyRef).onDestroy(() => {
      versions.unsubscribe();
      broken.unsubscribe();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    });
  }

  /** Reloads on the new version (a broken one just reloads: the worker then serves the latest). */
  async apply(): Promise<void> {
    if (this.updates?.isEnabled && !this.brokenSignal()) {
      await this.updates.activateUpdate().catch(() => false);
    }
    this.reloadPage();
  }
}
