import {
  BOARD_SIZE,
  type Cell,
  cellIndex,
  type Fleet,
  type GameState,
  other,
  type Player,
  SHIP_IDS,
  SHIP_LENGTHS,
  type ShipPlacement,
  shipCells,
  shipRim,
  type Shot,
} from '@fleet/core';
import type { Messages } from '@i18n';
import type { TrainView } from './fleet-trains/fleet-trains.model';
import type { CellState, ShipOverlay, WaterCell } from './fleet-waters/fleet-waters.model';

const ROWS = 'ABCDEFGHIJ';

/** A cell as players name it: row letter and column number (`F4`). */
export const cellName = ({ row, col }: Cell): string => `${ROWS[row] ?? '?'}${col + 1}`;

/** The row letters and column numbers around a board. */
export const ROW_NAMES = [...ROWS];
export const COL_NAMES = Array.from({ length: BOARD_SIZE }, (_, i) => String(i + 1));

const ALL: readonly Cell[] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => ({
  row: Math.floor(i / BOARD_SIZE),
  col: i % BOARD_SIZE,
}));

export const overlay = (placement: ShipPlacement, selected = false): ShipOverlay => ({
  ship: placement.ship,
  row: placement.row,
  col: placement.col,
  length: SHIP_LENGTHS[placement.ship],
  orientation: placement.orientation,
  selected,
});

/** The ships sunk by `shots`, where they lay. */
export const sunkBy = (shots: readonly Shot[]): ShipPlacement[] =>
  shots.flatMap((shot) => (shot.sunk ? [shot.sunk] : []));

/** What a cell's state is called for screen readers. */
const spoken = (state: CellState): Parameters<Messages['fleet']['cell']>[1] =>
  state === 'rim' ? 'water' : state;

/** What a board shows: the ships known on it, the shots fired at it and the last one. */
export interface BoardOf {
  readonly fleet: Fleet | null;
  readonly shots: readonly Shot[];
  readonly last?: Shot | null;
  readonly rims?: boolean;
}

/**
 * A board as one player sees it: `fleet` (the ships known there: the viewer's own, or the rival's
 * once over) and `shots` fired at it, with the last one marked. With `rims`, the water around
 * every ship of `fleet` is marked too: while placing, where no other ship may go.
 */
export function waterCells(
  t: Messages,
  { fleet, shots, last = null, rims = false }: BoardOf,
): WaterCell[] {
  const fired = new Map(shots.map((shot) => [cellIndex(shot), shot]));
  const sunk = sunkBy(shots);
  const wrecks = new Set(sunk.flatMap(shipCells).map(cellIndex));
  const rim = new Set([...sunk, ...(rims ? (fleet ?? []) : [])].flatMap(shipRim).map(cellIndex));
  const ships = new Set((fleet ?? []).flatMap(shipCells).map(cellIndex));
  return ALL.map((cell) => {
    const index = cellIndex(cell);
    const shot = fired.get(index);
    const state: CellState = wrecks.has(index)
      ? 'sunk'
      : shot?.outcome === 'pending'
        ? 'pending'
        : shot?.outcome === 'hit'
          ? ships.has(index)
            ? 'shipHit'
            : 'hit'
          : shot
            ? 'water'
            : ships.has(index)
              ? 'ship'
              : rim.has(index)
                ? 'rim'
                : 'unknown';
    const name = cellName(cell);
    return {
      index,
      ...cell,
      name,
      state,
      label: t.fleet.cell(name, spoken(state)),
      last: last !== null && cellIndex(last) === index,
    };
  });
}

/**
 * A fleet as trains of coaches: each ship, its hits from the shots fired at it, and whether it
 * sank. Without the fleet (the rival's, hidden) only the sunk ships are known, full.
 */
export function trains(t: Messages, fleet: Fleet | null, shots: readonly Shot[]): TrainView[] {
  const sunk = sunkBy(shots).map((ship) => ship.ship);
  const hit = new Set(
    shots
      .filter((shot) => shot.outcome === 'hit' || shot.outcome === 'sunk')
      .map((shot) => cellIndex(shot)),
  );
  return SHIP_IDS.map((ship) => {
    const length = SHIP_LENGTHS[ship];
    const placement = fleet?.find((p) => p.ship === ship);
    const isSunk = sunk.includes(ship);
    const coaches = isSunk
      ? Array.from({ length }, () => true)
      : placement
        ? shipCells(placement).map((cell) => hit.has(cellIndex(cell)))
        : Array.from({ length }, () => false);
    const hits = coaches.filter(Boolean).length;
    return {
      ship,
      length,
      hits,
      sunk: isSunk,
      coaches,
      label: t.fleet.shipState(t.fleet.ships[ship], length, hits, isSunk),
    };
  });
}

/** Ships of `player`'s rival still afloat, as `player` knows it. */
export const afloat = (view: GameState, player: Player): number =>
  SHIP_IDS.length - sunkBy(view.shots[player]).length;

/** The rival of `player`. */
export const rivalOf = other;

/** What the battle shows of both boards, from this device's player's view. */
export function battleViews(
  t: Messages,
  view: GameState,
  me: Player,
  last: { readonly by: Player; readonly shot: Shot } | null,
) {
  const rival = other(me);
  const over = view.phase === 'over';
  // Once over, the rival's fleet is shown where it lay.
  const rivalFleet = over ? view.fleets[rival] : null;
  const sunkByMe = sunkBy(view.shots[me]);
  const ownFleet = view.fleets[me];
  const lastAt = (by: Player) => (last?.by === by ? last.shot : null);
  return {
    enemy: {
      cells: waterCells(t, { fleet: rivalFleet, shots: view.shots[me], last: lastAt(me) }),
      ships: (rivalFleet ?? [])
        .filter((ship) => !sunkByMe.some((sunk) => sunk.ship === ship.ship))
        .map((ship) => overlay(ship)),
      wrecks: sunkByMe.map((ship) => overlay(ship)),
      trains: trains(t, rivalFleet, view.shots[me]),
      afloat: afloat(view, me),
    },
    own: {
      cells: waterCells(t, { fleet: ownFleet, shots: view.shots[rival], last: lastAt(rival) }),
      ships: (ownFleet ?? []).map((ship) => overlay(ship)),
      wrecks: sunkBy(view.shots[rival]).map((ship) => overlay(ship)),
      trains: trains(t, ownFleet, view.shots[rival]),
    },
  };
}
