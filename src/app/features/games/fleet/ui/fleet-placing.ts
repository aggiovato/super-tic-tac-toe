import {
  type Cell,
  type Fleet,
  fleetProblem,
  type FleetProblem,
  SHIP_LENGTHS,
  type ShipId,
  type ShipPlacement,
} from '@fleet/core';

/** Where a ship lands when a player taps a cell for it, or why it cannot go there. */
export type Landing =
  | { readonly ok: true; readonly fleet: Fleet }
  | { readonly ok: false; readonly problem: FleetProblem };

/**
 * Moves `ship` so that it covers `cell`, keeping its orientation (turning is the player's own
 * choice): the tapped cell as its bow first, then sliding back one cell at a time (the bow up or
 * left of it) until the ship fits on the board and touches no other. So a tap near the edge places
 * the ship ending there instead of refusing it. When no position fits, the reason given is a
 * neighbour's (`touching`, `overlap`) over the board's edge, since that is what stands in the way.
 */
export function placeCovering(fleet: Fleet, ship: ShipId, cell: Cell): Landing {
  const current = fleet.find((placement) => placement.ship === ship);
  if (!current) return { ok: false, problem: 'composition' };
  const problems: FleetProblem[] = [];
  for (let back = 0; back < SHIP_LENGTHS[ship]; back++) {
    const moved: ShipPlacement =
      current.orientation === 'h'
        ? { ...current, row: cell.row, col: cell.col - back }
        : { ...current, row: cell.row - back, col: cell.col };
    const next = fleet.map((placement) => (placement.ship === ship ? moved : placement));
    const problem = fleetProblem(next);
    if (!problem) return { ok: true, fleet: next };
    problems.push(problem);
  }
  return { ok: false, problem: problems.find((p) => p !== 'out-of-bounds') ?? 'out-of-bounds' };
}
