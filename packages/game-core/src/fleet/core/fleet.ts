import { pickWeighted, type Random } from '@tictac';
import {
  BOARD_SIZE,
  type Cell,
  type Fleet,
  type FleetProblem,
  SHIP_IDS,
  SHIP_LENGTHS,
  type ShipId,
  type ShipPlacement,
} from './models';

/** A cell's index on a board, row by row, or -1 when it is off the board. */
export function cellIndex({ row, col }: Cell): number {
  const inside =
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    col >= 0 &&
    row < BOARD_SIZE &&
    col < BOARD_SIZE;
  return inside ? row * BOARD_SIZE + col : -1;
}

/** The cells a ship covers, bow first; some may be off the board. */
export function shipCells({ ship, row, col, orientation }: ShipPlacement): Cell[] {
  return Array.from({ length: SHIP_LENGTHS[ship] }, (_, i) =>
    orientation === 'h' ? { row, col: col + i } : { row: row + i, col },
  );
}

/** The cells around a ship (diagonals included) that are on the board: water, since ships never touch. */
export function shipRim(placement: ShipPlacement): Cell[] {
  const body = new Set(shipCells(placement).map(cellIndex));
  const rim = new Map<number, Cell>();
  for (const { row, col } of shipCells(placement)) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const cell = { row: row + dr, col: col + dc };
        const index = cellIndex(cell);
        if (index >= 0 && !body.has(index)) rim.set(index, cell);
      }
    }
  }
  return [...rim.values()];
}

/**
 * Why a fleet cannot be placed, or null when it can. In order: each ship of `SHIP_IDS` exactly
 * once, every cell on the board, no two ships on one cell, no two ships side by side or corner to
 * corner.
 */
export function fleetProblem(fleet: Fleet): FleetProblem | null {
  const ids = fleet.map((placement) => placement.ship);
  const complete = ids.length === SHIP_IDS.length && SHIP_IDS.every((ship) => ids.includes(ship));
  const shaped = fleet.every(
    (placement) => placement.orientation === 'h' || placement.orientation === 'v',
  );
  if (!complete || !shaped) return 'composition';
  if (fleet.some((placement) => shipCells(placement).some((cell) => cellIndex(cell) < 0))) {
    return 'out-of-bounds';
  }
  const owner = new Map<number, number>();
  for (const [ship, placement] of fleet.entries()) {
    for (const cell of shipCells(placement)) {
      if (owner.has(cellIndex(cell))) return 'overlap';
      owner.set(cellIndex(cell), ship);
    }
  }
  for (const [ship, placement] of fleet.entries()) {
    const near = shipRim(placement).map((cell) => owner.get(cellIndex(cell)));
    if (near.some((other) => other !== undefined && other !== ship)) return 'touching';
  }
  return null;
}

/** The fleet's ship at a cell, or null for water. */
export function shipAt(fleet: Fleet, cell: Cell): ShipPlacement | null {
  const index = cellIndex(cell);
  return (
    fleet.find((placement) => shipCells(placement).some((part) => cellIndex(part) === index)) ??
    null
  );
}

/** A copy of a fleet holding only the fields a placement has, in `SHIP_IDS` order. */
export function normalizeFleet(fleet: Fleet): Fleet {
  return SHIP_IDS.flatMap((ship) =>
    fleet
      .filter((placement) => placement.ship === ship)
      .map(({ row, col, orientation }) => ({ ship, row, col, orientation })),
  );
}

/** Whether two fleets place every ship on the same cells, in the same way. */
export function sameFleet(a: Fleet, b: Fleet): boolean {
  const key = (fleet: Fleet) =>
    JSON.stringify(normalizeFleet(fleet).map((p) => [p.ship, p.row, p.col, p.orientation]));
  return a.length === b.length && key(a) === key(b);
}

/**
 * A legal fleet at random: ships placed largest first, each on a random spot that touches none
 * placed before. The board is roomy enough that every ship finds one: four ships and the water
 * around them leave the 100 cells far from blocking a destroyer (`pickWeighted` would throw).
 */
export function randomFleet(random: Random): Fleet {
  const fleet: ShipPlacement[] = [];
  // Cells a new ship may not cover: the ships placed so far and the water around them.
  const taken = new Set<number>();
  for (const ship of SHIP_IDS) {
    const spots = PLACEMENTS[ship].filter((spot) =>
      shipCells(spot).every((cell) => !taken.has(cellIndex(cell))),
    );
    const spot = pickWeighted(spots, () => 1, random);
    fleet.push(spot);
    for (const cell of [...shipCells(spot), ...shipRim(spot)]) taken.add(cellIndex(cell));
  }
  return fleet;
}

/** Every spot on the board where a ship fits, ignoring the rest of the fleet. */
export function allPlacements(ship: ShipId): ShipPlacement[] {
  const spots: ShipPlacement[] = [];
  for (const orientation of ['h', 'v'] as const) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const spot = { ship, row, col, orientation };
        if (shipCells(spot).every((cell) => cellIndex(cell) >= 0)) spots.push(spot);
      }
    }
  }
  return spots;
}

/** Every spot of every ship, computed once. */
const PLACEMENTS: Readonly<Record<ShipId, readonly ShipPlacement[]>> = {
  carrier: allPlacements('carrier'),
  battleship: allPlacements('battleship'),
  cruiser: allPlacements('cruiser'),
  submarine: allPlacements('submarine'),
  destroyer: allPlacements('destroyer'),
};
