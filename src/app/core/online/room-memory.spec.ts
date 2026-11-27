import { TestBed } from '@angular/core/testing';
import { RoomMemory } from './room-memory';

describe('the seats this device holds', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the last chat message read in a room, only ever forward', () => {
    const store = TestBed.inject(RoomMemory);
    store.save('room-1', { gameId: 'classic', seat: 0, token: 't', savedAt: Date.now() });
    store.setReadChat('room-1', 4);
    store.setReadChat('room-1', 2);
    expect(store.get('room-1')?.readChat).toBe(4);
    // Without a seat in the room there is nothing to remember it with.
    store.setReadChat('room-2', 9);
    expect(store.get('room-2')).toBeNull();
  });
});
