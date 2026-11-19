import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('App routes', () => {
  it('opens the game on the root path', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create('/');
    const heading = harness.routeNativeElement?.querySelector('h1');
    expect(heading?.textContent).toContain('Super Tic Tac Toe');
  });
});
