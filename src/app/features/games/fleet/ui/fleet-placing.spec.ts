import { type Fleet, fleetProblem } from '@fleet/core';
import { cell, fleet } from '@fleet/core/testing';
import { placeCovering } from './fleet-placing';

// Carrier A1–A5, battleship C1–F1, cruiser C3–C5, submarine G5–I5, destroyer J8–J9.
const FLEET = fleet('A1h C1v C3h G5v J8h');

const shipOf = (placed: Fleet, ship: string) => placed.find((p) => p.ship === ship);

describe('placing a ship where the player taps', () => {
  it('puts the bow on the tapped cell when the ship fits from there', () => {
    const landing = placeCovering(FLEET, 'carrier', cell('E5'));
    expect(landing.ok && shipOf(landing.fleet, 'carrier')).toMatchObject(cell('E5'));
  });

  it('slides back from the edge so the ship ends on the tapped cell', () => {
    // The carrier is horizontal: a tap on E10 places it on E6–E10, not off the board.
    const landing = placeCovering(FLEET, 'carrier', cell('E10'));
    expect(landing.ok && shipOf(landing.fleet, 'carrier')).toMatchObject(cell('E6'));
    expect(landing.ok && fleetProblem(landing.fleet)).toBeNull();
  });

  it('slides up from the bottom edge for an upright ship', () => {
    // The battleship is upright: a tap on J3 places it on G3–J3.
    const placed = placeCovering(FLEET, 'battleship', cell('J3'));
    expect(placed.ok && shipOf(placed.fleet, 'battleship')).toMatchObject(cell('G3'));
  });

  it("keeps the orientation: turning stays the player's choice", () => {
    const landing = placeCovering(FLEET, 'carrier', cell('E10'));
    expect(landing.ok && shipOf(landing.fleet, 'carrier')?.orientation).toBe('h');
  });

  it('refuses when no position covering the cell fits, naming the neighbour in the way', () => {
    // The destroyer sits on J8–J9: every carrier position through J10 runs over it.
    expect(placeCovering(FLEET, 'carrier', cell('J10'))).toEqual({ ok: false, problem: 'overlap' });
    // The submarine stands on G5–I5: a cruiser through H6 runs over it or sits beside it.
    expect(placeCovering(FLEET, 'cruiser', cell('H6'))).toEqual({ ok: false, problem: 'touching' });
  });
});
