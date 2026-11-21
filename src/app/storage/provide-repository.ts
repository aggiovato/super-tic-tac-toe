import { DOCUMENT, inject, type Provider } from '@angular/core';
import { GameRepository } from './game-repository';
import { IndexedDbRepository } from './indexed-db-repository';
import { MemoryRepository } from './memory-repository';

/** The app's repository: IndexedDB where the browser has it, memory for this visit otherwise. */
export function provideGameRepository(): Provider {
  return {
    provide: GameRepository,
    useFactory: (): GameRepository => {
      const factory = inject(DOCUMENT).defaultView?.indexedDB;
      return factory ? new IndexedDbRepository(factory) : new MemoryRepository();
    },
  };
}
