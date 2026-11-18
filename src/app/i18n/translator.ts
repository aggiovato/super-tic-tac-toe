import { DOCUMENT, computed, effect, inject, Injectable, signal } from '@angular/core';
import { MESSAGES, type Lang } from './messages';

const STORAGE_KEY = 'super-ttt.lang';

/** Current language and its messages. Follows the browser until the player picks one. */
@Injectable({ providedIn: 'root' })
export class Translator {
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<Lang>(this.initialLang());
  readonly t = computed(() => MESSAGES[this.lang()]);

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.lang();
    });
  }

  toggle(): void {
    const next: Lang = this.lang() === 'es' ? 'en' : 'es';
    this.lang.set(next);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be blocked (private mode); the choice then lasts for this visit only.
    }
  }

  private initialLang(): Lang {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
    } catch {
      // Fall through to the browser language.
    }
    const browser = this.document.defaultView?.navigator.language ?? 'en';
    return browser.toLowerCase().startsWith('es') ? 'es' : 'en';
  }
}
