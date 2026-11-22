import { TestBed } from '@angular/core/testing';
import { Preferences } from './player-preferences';

const KEY = 'super-ttt.preferences';

describe('reading saved preferences', () => {
  beforeEach(() => localStorage.clear());

  it('reads the modes stored before schema 2 as today’s', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        play: {
          'super-3t': { mode: 'opponent', level: 'advanced' },
          classic: { mode: 'humans', level: 'beginner' },
        },
      }),
    );
    const play = TestBed.inject(Preferences).play();
    expect(play['super-3t']).toEqual({ mode: 'computer', level: 'advanced' });
    expect(play.classic).toEqual({ mode: 'local', level: 'beginner' });
  });

  it('falls back to two people for a mode it does not know', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ play: { dots: { mode: 'chess', level: 'beginner' } } }),
    );
    expect(TestBed.inject(Preferences).play().dots.mode).toBe('local');
  });
});
