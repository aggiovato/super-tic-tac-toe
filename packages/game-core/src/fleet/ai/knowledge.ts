import {
  allPlacements,
  BOARD_SIZE,
  type Cell,
  cellIndex,
  type FleetView,
  SHIP_IDS,
  SHIP_LENGTHS,
  type ShipId,
  type ShipPlacement,
  shipCells,
  shipRim,
} from '@fleet/core';

/** Every spot of every ship on an empty board, computed once. */
const SPOTS: Readonly<Record<ShipId, readonly ShipPlacement[]>> = {
  carrier: allPlacements('carrier'),
  battleship: allPlacements('battleship'),
  cruiser: allPlacements('cruiser'),
  submarine: allPlacements('submarine'),
  destroyer: allPlacements('destroyer'),
};

const ALL_CELLS: readonly Cell[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => ({
  row: Math.floor(i / BOARD_SIZE),
  col: i % BOARD_SIZE,
}));

/**
 * What the shooter knows of the rival's waters, from their own view only: the cells fired at, the
 * cells known to be water (misses, the rim of every sunk ship, the corners of every hit, since a
 * ship is straight and ships never touch), the hits of ships still afloat and the ships left.
 */
export class Knowledge {
  readonly fired = new Set<number>();
  readonly water = new Set<number>();
  /** Hits on ships not sunk yet. */
  readonly open: Cell[] = [];
  /** Cells of sunk ships. */
  readonly wrecks = new Set<number>();
  /** Ships of the rival still afloat, largest first. */
  readonly afloat: ShipId[];

  constructor(view: FleetView) {
    const shots = view.shots[view.viewer];
    const sunk = shots.flatMap((shot) => (shot.sunk ? [shot.sunk] : []));
    for (const ship of sunk) {
      for (const cell of shipCells(ship)) this.wrecks.add(cellIndex(cell));
      for (const cell of shipRim(ship)) this.water.add(cellIndex(cell));
    }
    for (const shot of shots) {
      const index = cellIndex(shot);
      this.fired.add(index);
      if (shot.outcome === 'water') this.water.add(index);
      else if (!this.wrecks.has(index)) this.open.push(shot);
    }
    for (const hit of [...this.open, ...sunk.flatMap(shipCells)]) {
      for (const corner of diagonals(hit)) this.water.add(cellIndex(corner));
    }
    const gone = sunk.map((ship) => ship.ship);
    this.afloat = SHIP_IDS.filter((ship) => !gone.includes(ship));
  }

  /** Cells not fired at yet. */
  untried(): Cell[] {
    return ALL_CELLS.filter((cell) => !this.fired.has(cellIndex(cell)));
  }

  /** Cells not fired at and not known to be water: where a ship may still be. */
  candidates(): Cell[] {
    return this.untried().filter((cell) => !this.water.has(cellIndex(cell)));
  }

  /** The length of the smallest ship afloat (2 when every ship is gone, which ends the game). */
  smallest(): number {
    return Math.min(...this.afloat.map((ship) => SHIP_LENGTHS[ship]), 2);
  }

  /**
   * How many ways the ships afloat could lie over each cell, given what is known: no part on water
   * or on a wreck. With open hits, only the ways through them count, weighted by how many they
   * cover, so the search follows a ship it has found.
   */
  density(): Map<number, number> {
    const counts = new Map<number, number>();
    const open = new Set(this.open.map(cellIndex));
    for (const ship of this.afloat) {
      for (const spot of SPOTS[ship]) {
        const cells = shipCells(spot).map(cellIndex);
        if (cells.some((i) => this.water.has(i) || this.wrecks.has(i))) continue;
        const through = cells.filter((i) => open.has(i)).length;
        if (open.size > 0 && through === 0) continue;
        const weight = open.size > 0 ? 10 ** through : 1;
        for (const i of cells) {
          if (!this.fired.has(i)) counts.set(i, (counts.get(i) ?? 0) + weight);
        }
      }
    }
    return counts;
  }
}

/** The (up to four) cells sharing a side with `cell`, on the board. */
export function neighbours({ row, col }: Cell): Cell[] {
  return [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].filter((cell) => cellIndex(cell) >= 0);
}

/** The (up to four) cells touching `cell` corner to corner, on the board. */
function diagonals({ row, col }: Cell): Cell[] {
  return [
    { row: row - 1, col: col - 1 },
    { row: row - 1, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col: col + 1 },
  ].filter((cell) => cellIndex(cell) >= 0);
}
