import { DOCUMENT, computed, effect, inject, Injectable, signal } from '@angular/core';
import { MESSAGES } from './messages';
import type { Lang } from './messages.model';

const STORAGE_KEY = 'super-ttt.lang';

/** Current language and its messages. Follows the browser until the player picks one. */
@Injectable({ providedIn: 'root' })
export class Translator {
  private readonly document = inject(DOCUMENT);

  readonly languages: readonly Lang[] = ['es', 'en'];
  readonly lang = signal<Lang>(this.initialLang());
  readonly t = computed(() => MESSAGES[this.lang()]);

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.lang();
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, lang);
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
