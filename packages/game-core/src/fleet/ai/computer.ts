import { type Cell, cellIndex, type GameState, type Move, randomFleet } from '@fleet/core';
import { createRandom, pickWeighted, type Random, turnSeed } from '@tictac';
import { Knowledge, neighbours } from './knowledge';

/** How strong the Ship Sink opponent plays, weakest first. */
export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

/** How often the beginner follows up a hit instead of firing anywhere. */
export const BEGINNER_FOLLOW_UP = 0.5;

export interface ComputerOptions {
  readonly level: Level;
  /** Integer seed for the whole game; each turn mixes it with the revision. */
  readonly seed: number;
}

const pick = (cells: readonly Cell[], random: Random): Cell => pickWeighted(cells, () => 1, random);

/** Whether a cell may still hold a ship: on the board, not fired at, not known to be water. */
const open = (known: Knowledge, cell: Cell): boolean =>
  cellIndex(cell) >= 0 && !known.fired.has(cellIndex(cell)) && !known.water.has(cellIndex(cell));

/** The cells beside the open hits that may still hold a ship: where the ship that was hit goes on. */
function around(known: Knowledge): Cell[] {
  const cells = new Map<number, Cell>();
  for (const cell of known.open.flatMap(neighbours)) {
    if (open(known, cell)) cells.set(cellIndex(cell), cell);
  }
  return [...cells.values()];
}

/**
 * The cells that extend a run of open hits side by side (a ship is straight, so it goes on at one
 * end or the other); empty while every open hit stands alone.
 */
function lineEnds(known: Knowledge): Cell[] {
  const hits = new Set(known.open.map(cellIndex));
  const isHit = (row: number, col: number) => hits.has(cellIndex({ row, col }));
  const ends: Cell[] = [];
  for (const { row, col } of known.open) {
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
    ] as const) {
      // Only from the first hit of a run, so each run is walked once.
      if (!isHit(row + dr, col + dc) || isHit(row - dr, col - dc)) continue;
      let length = 1;
      while (isHit(row + dr * length, col + dc * length)) length++;
      ends.push(
        { row: row - dr, col: col - dc },
        { row: row + dr * length, col: col + dc * length },
      );
    }
  }
  return ends.filter((cell) => open(known, cell));
}

/** Fires anywhere it has not fired; after a hit, only sometimes tries the cells beside it. */
function beginner(known: Knowledge, random: Random): Cell {
  const beside = known.open.flatMap(neighbours).filter((cell) => !known.fired.has(cellIndex(cell)));
  if (beside.length > 0 && random() < BEGINNER_FOLLOW_UP) return pick(beside, random);
  return pick(known.untried(), random);
}

/**
 * Hunts on a lattice spaced by the smallest ship afloat (no ship can hide between its points), then
 * targets: extends a line of hits, or tries beside a lone hit. Never fires where it knows there is
 * water: misses, a sunk ship's rim, a hit's corners.
 */
function intermediate(known: Knowledge, random: Random): Cell {
  const ends = lineEnds(known);
  if (ends.length > 0) return pick(ends, random);
  const beside = around(known);
  if (beside.length > 0) return pick(beside, random);
  const candidates = known.candidates();
  const step = known.smallest();
  const lattice = candidates.filter((cell) => (cell.row + cell.col) % step === 0);
  return pick(lattice.length > 0 ? lattice : candidates, random);
}

/**
 * Counts every way the ships afloat could still lie and fires where most of them meet; with a ship
 * found, only the ways through its hits count.
 */
function advanced(known: Knowledge, random: Random): Cell {
  const density = known.density();
  const best = Math.max(0, ...density.values());
  const top = known.candidates().filter((cell) => (density.get(cellIndex(cell)) ?? 0) === best);
  return pick(top.length > 0 ? top : known.untried(), random);
}

const SHOOTERS: Readonly<Record<Level, (known: Knowledge, random: Random) => Cell>> = {
  beginner,
  intermediate,
  advanced,
};

/**
 * The computer's move in its own view of the game, or null when it has none to make (its fleet is
 * placed and the rival's is not, it is not its turn, or the game is over). It reads only the view:
 * never the rival's fleet, which the view does not hold until the game ends. Seeded by the game and
 * the revision, so the same game replays the same choices; its fleet comes from the seed alone.
 */
export function chooseMove(view: GameState, options: ComputerOptions): Move | null {
  if (!LEVELS.includes(options.level)) {
    throw new Error(`Unknown level: ${String(options.level)}`);
  }
  const me = view.viewer;
  if (me === null) {
    throw new Error('The computer plays from its own view, never the whole game');
  }
  if (view.phase === 'placing') {
    return view.placed[me]
      ? null
      : { kind: 'place', player: me, fleet: randomFleet(createRandom(options.seed >>> 0)) };
  }
  if (view.phase !== 'firing' || view.turn !== me) {
    return null;
  }
  const random = createRandom(turnSeed(options.seed, view.revision));
  const { row, col } = SHOOTERS[options.level](new Knowledge({ ...view, viewer: me }), random);
  return { kind: 'shot', row, col };
}
