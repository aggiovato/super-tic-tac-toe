import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GameRepository, MemoryRepository } from '@storage';
import { GAME_PREVIEWS } from '@library';
import { routes } from './app.routes';
import { GAME_PREVIEW_COMPONENTS } from './game-ui';

describe('App routes', () => {
  it('opens the game on the root path', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: GameRepository, useClass: MemoryRepository },
        { provide: GAME_PREVIEWS, useValue: GAME_PREVIEW_COMPONENTS },
      ],
    });
    const harness = await RouterTestingHarness.create('/');
    const heading = harness.routeNativeElement?.querySelector('h1');
    // "Super" in text, "3T" as the mark's alt text: the heading reads "Super 3T".
    expect(heading?.textContent).toContain('Super');
    expect(heading?.querySelector('img')?.getAttribute('alt')).toBe('3T');
  });
});
