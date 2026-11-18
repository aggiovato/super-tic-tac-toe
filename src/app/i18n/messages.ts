import type { Player } from '@core';

export type Lang = 'es' | 'en';

/** Every user-facing string. Both languages must implement the whole interface. */
export interface Messages {
  readonly langName: string;
  readonly switchLanguage: string;
  /** Short words that fit on the flap row. */
  readonly flap: { readonly free: string; readonly wins: string; readonly draw: string };
  readonly departureLabel: string;
  readonly opening: string;
  readonly forced: (mover: Player, cell: number, next: Player) => string;
  readonly freeChoice: (mover: Player, cell: number, next: Player) => string;
  readonly preview: (next: Player, board: number | null) => string;
  readonly won: (winner: Player) => string;
  readonly drawn: string;
  readonly status: {
    readonly forced: (next: Player, board: number) => string;
    readonly free: (next: Player) => string;
    readonly won: (winner: Player) => string;
    readonly drawn: string;
  };
  readonly boardLabel: string;
  readonly board: (board: number) => string;
  readonly openBoard: (board: number) => string;
  readonly cell: (board: number, cell: number, mark: Player | null) => string;
  readonly closedWon: (board: number, winner: Player) => string;
  readonly closedDrawn: (board: number) => string;
  readonly backToBoard: string;
  readonly player: (index: number, symbol: Player) => string;
  readonly draws: string;
  readonly score: string;
  readonly rematch: string;
  readonly newSeries: string;
}

export const MESSAGES: Record<Lang, Messages> = {
  es: {
    langName: 'Español',
    switchLanguage: 'English',
    flap: { free: 'LIBRE', wins: 'GANA', draw: 'TABLAS' },
    departureLabel: 'Siguiente turno',
    opening: 'Elige dónde empezar: cualquier casilla vale.',
    forced: (mover, cell, next) =>
      `${mover} jugó la casilla ${cell}, así que ${next} juega en el tablero ${cell}.`,
    freeChoice: (mover, cell, next) =>
      `${mover} jugó la casilla ${cell}, pero el tablero ${cell} está cerrado: ${next} elige tablero.`,
    preview: (next, board) =>
      board === null
        ? `Si juegas aquí, ${next} elegirá tablero.`
        : `Si juegas aquí, ${next} irá al tablero ${board}.`,
    won: (winner) => `${winner} gana con tres tableros en línea.`,
    drawn: 'Tablas: todos los tableros están cerrados y nadie hizo línea.',
    status: {
      forced: (next, board) => `Turno de ${next}. Debe jugar en el tablero ${board}.`,
      free: (next) => `Turno de ${next}. Puede elegir cualquier tablero abierto.`,
      won: (winner) => `Partida terminada. Gana ${winner}.`,
      drawn: 'Partida terminada en tablas.',
    },
    boardLabel: 'Tablero de juego',
    board: (board) => `Tablero ${board}`,
    openBoard: (board) => `Ampliar el tablero ${board}`,
    cell: (board, cell, mark) => `Tablero ${board}, casilla ${cell}, ${mark ?? 'vacía'}`,
    closedWon: (board, winner) => `Tablero ${board}, ganado por ${winner}`,
    closedDrawn: (board) => `Tablero ${board}, en tablas`,
    backToBoard: 'Ver todo el tablero',
    player: (index, symbol) => `Jugador ${index} (${symbol})`,
    draws: 'Tablas',
    score: 'Marcador de la serie',
    rematch: 'Revancha',
    newSeries: 'Nueva serie',
  },
  en: {
    langName: 'English',
    switchLanguage: 'Español',
    flap: { free: 'FREE', wins: 'WINS', draw: 'DRAW' },
    departureLabel: 'Next turn',
    opening: 'Choose where to start: any cell will do.',
    forced: (mover, cell, next) =>
      `${mover} played cell ${cell}, so ${next} plays on board ${cell}.`,
    freeChoice: (mover, cell, next) =>
      `${mover} played cell ${cell}, but board ${cell} is closed: ${next} picks a board.`,
    preview: (next, board) =>
      board === null
        ? `If you play here, ${next} picks a board.`
        : `If you play here, ${next} goes to board ${board}.`,
    won: (winner) => `${winner} wins with three boards in a row.`,
    drawn: 'Draw: every board is closed and nobody made a line.',
    status: {
      forced: (next, board) => `${next} to move. Must play on board ${board}.`,
      free: (next) => `${next} to move. May pick any open board.`,
      won: (winner) => `Game over. ${winner} wins.`,
      drawn: 'Game over. Draw.',
    },
    boardLabel: 'Game board',
    board: (board) => `Board ${board}`,
    openBoard: (board) => `Zoom into board ${board}`,
    cell: (board, cell, mark) => `Board ${board}, cell ${cell}, ${mark ?? 'empty'}`,
    closedWon: (board, winner) => `Board ${board}, won by ${winner}`,
    closedDrawn: (board) => `Board ${board}, drawn`,
    backToBoard: 'Show the whole board',
    player: (index, symbol) => `Player ${index} (${symbol})`,
    draws: 'Draws',
    score: 'Series score',
    rematch: 'Rematch',
    newSeries: 'New series',
  },
};
