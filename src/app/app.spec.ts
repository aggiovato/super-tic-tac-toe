import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GameRepository, MemoryRepository } from '@storage';
import { routes } from './app.routes';

describe('App routes', () => {
  it('opens the game on the root path', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: GameRepository, useClass: MemoryRepository }],
    });
    const harness = await RouterTestingHarness.create('/');
    const heading = harness.routeNativeElement?.querySelector('h1');
    // "Super" in text, "3T" as the mark's alt text: the heading reads "Super 3T".
    expect(heading?.textContent).toContain('Super');
    expect(heading?.querySelector('img')?.getAttribute('alt')).toBe('3T');
  });
});
