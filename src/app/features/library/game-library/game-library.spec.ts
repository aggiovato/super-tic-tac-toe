import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ACTIVE_GAME } from '@match';
import { GameLibrary } from './game-library';
import { GAME_PREVIEWS } from './game-previews';

@Component({ selector: 'app-fake-preview', template: '' })
class FakePreview {
  readonly square = input(false);
}

function render(current: 'super-3t' | 'classic' | 'dots' | null) {
  TestBed.configureTestingModule({
    imports: [GameLibrary],
    providers: [
      provideRouter([]),
      {
        provide: GAME_PREVIEWS,
        useValue: { 'super-3t': FakePreview, classic: FakePreview, dots: FakePreview },
      },
      ...(current ? [{ provide: ACTIVE_GAME, useValue: { id: current, match: {} } }] : []),
    ],
  });
  const fixture = TestBed.createComponent(GameLibrary);
  fixture.detectChanges();
  const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
  return { fixture, links };
}

describe('GameLibrary', () => {
  it('leads with Super 3T as the banner and links every game', () => {
    const { links } = render('dots');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/super-3t',
      '/fleet',
      '/dots',
      '/classic',
    ]);
    expect(links[0].classList).toContain('banner');
  });

  it('marks only the game on screen as playing', () => {
    const { links } = render('classic');
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([
      null,
      null,
      null,
      'page',
    ]);
    expect(links[3].querySelector('.badge')).not.toBeNull();
    expect(links[0].querySelector('.badge')).toBeNull();
  });

  it('marks nothing outside a game', () => {
    const { links } = render(null);
    expect(links.every((link) => !link.hasAttribute('aria-current'))).toBe(true);
  });

  it('says a game was chosen when its card is followed', () => {
    const { fixture, links } = render('super-3t');
    const chosen: string[] = [];
    fixture.componentInstance.chosen.subscribe((id) => chosen.push(id));
    // A modified click: the router leaves it to the browser, so no navigation outlives the test.
    links[2].dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
    );
    expect(chosen).toEqual(['dots']);
  });
});
