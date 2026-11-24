import type { Player } from '@tictac';
import { applyMove, initialState } from '../engine';
import {
  type Cell,
  type Fleet,
  type GameState,
  type Move,
  SHIP_IDS,
  type ShipPlacement,
} from '../models';

const ROWS = 'ABCDEFGHIJ';

/** A cell as players name it: `'F4'` is row F (5), column 4 (3). */
export function cell(name: string): Cell {
  const row = ROWS.indexOf(name[0] ?? '');
  const col = Number(name.slice(1)) - 1;
  if (row < 0 || !Number.isInteger(col) || col < 0 || col > 9) {
    throw new Error(`Invalid cell "${name}"`);
  }
  return { row, col };
}

/** The name players use for a cell (`F4`). */
export const label = ({ row, col }: Cell): string => `${ROWS[row] ?? '?'}${col + 1}`;

/** A fleet in `SHIP_IDS` order, each ship as its bow and orientation: `'A1h C1v C3h G5v J8h'`. */
export function fleet(notation: string): Fleet {
  const tokens = notation.trim().split(/\s+/);
  if (tokens.length !== SHIP_IDS.length) {
    throw new Error(`A fleet needs ${SHIP_IDS.length} ships: "${notation}"`);
  }
  return tokens.map((token, i): ShipPlacement => {
    const orientation = token.at(-1);
    if (orientation !== 'h' && orientation !== 'v') {
      throw new Error(`Invalid ship "${token}"`);
    }
    return { ship: SHIP_IDS[i] ?? 'carrier', ...cell(token.slice(0, -1)), orientation };
  });
}

/** Shots as moves: `'F4 F5'`. */
export const shots = (notation: string): Move[] =>
  notation
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => ({ kind: 'shot', ...cell(name) }));

/**
 * Places both fleets (X first) and fires the shots in order, each by whoever is to fire; fails
 * loudly on the first refused move.
 */
export function play(
  fleets: { readonly X: Fleet; readonly O: Fleet },
  fired = '',
  from: GameState = initialState(),
): GameState {
  const placements: Move[] = (['X', 'O'] as const satisfies readonly Player[]).map((player) => ({
    kind: 'place',
    player,
    fleet: fleets[player],
  }));
  return [...placements, ...shots(fired)].reduce((state, move, index) => {
    const result = applyMove(state, move);
    if (!result.ok) {
      const name = move.kind === 'shot' ? label(move) : `${move.player} fleet`;
      throw new Error(`Move ${index} (${name}) rejected: ${result.reason}`);
    }
    return result.state;
  }, from);
}
