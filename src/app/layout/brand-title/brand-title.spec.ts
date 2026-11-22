import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrandTitle } from './brand-title';

@Component({
  imports: [BrandTitle],
  template: `<app-brand-title [wonBoards]="won()" />`,
})
class Host {
  readonly won = signal<number | null>(null);
}

describe('the brand title', () => {
  const flapsShown = (fixture: { nativeElement: HTMLElement }) =>
    fixture.nativeElement.querySelector('.flaps')?.classList.contains('shown');

  it('takes a restored game as its baseline, and unfolds only when a board is won after', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    // The saved game comes back with two boards won: not a closing.
    fixture.componentInstance.won.set(2);
    fixture.detectChanges();
    TestBed.tick();
    expect(flapsShown(fixture)).toBe(false);
    fixture.componentInstance.won.set(3);
    fixture.detectChanges();
    TestBed.tick();
    expect(flapsShown(fixture)).toBe(true);
  });
});
