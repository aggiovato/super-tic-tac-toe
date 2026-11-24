import { fleet } from './notation';

/**
 * Two reference fleets. FLEET_A: carrier A1–A5, battleship C1–F1, cruiser C3–C5, submarine G5–I5,
 * destroyer J8–J9. FLEET_B: carrier J1–J5, battleship A10–D10, cruiser E4–E6, submarine A6–C6,
 * destroyer G8–H8.
 */
export const FLEET_A = fleet('A1h C1v C3h G5v J8h');
export const FLEET_B = fleet('J1h A10v E4h A6v G8v');

/** Every cell of FLEET_B, ship by ship: the shots that sink it, each a hit or a sinking shot. */
export const SINK_B = 'J1 J2 J3 J4 J5 A10 B10 C10 D10 E4 E5 E6 A6 B6 C6 G8 H8';

/** Every cell of FLEET_A, ship by ship. */
export const SINK_A = 'A1 A2 A3 A4 A5 C1 D1 E1 F1 C3 C4 C5 G5 H5 I5 J8 J9';
