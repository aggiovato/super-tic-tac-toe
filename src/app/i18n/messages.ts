import type { RejectionReason } from '@core';

export type Lang = 'es' | 'en';

/**
 * Every user-facing string. Both languages implement the whole interface. Board and cell numbers
 * arrive as shown to players (1–9); `who` is a player's name or symbol.
 */
export interface Messages {
  readonly langName: string;
  /** Words for the flap row: `free` and `wins` take 5 tiles, `draw` the whole row of 7. */
  readonly flap: { readonly free: string; readonly wins: string; readonly draw: string };
  readonly departureLabel: string;
  readonly opening: string;
  readonly forced: (mover: string, cell: number, next: string) => string;
  readonly freeChoice: (mover: string, cell: number, next: string) => string;
  readonly preview: (next: string, board: number | null) => string;
  readonly rejected: (reason: RejectionReason, board: number | null) => string;
  readonly won: (winner: string) => string;
  readonly drawn: string;
  readonly status: {
    readonly forced: (next: string, board: number) => string;
    readonly free: (next: string) => string;
    readonly won: (winner: string) => string;
    readonly drawn: string;
  };
  readonly boardLabel: string;
  readonly board: (board: number) => string;
  readonly openBoard: (board: number) => string;
  readonly cell: (board: number, cell: number, mark: string | null) => string;
  readonly closedWon: (board: number, winner: string) => string;
  readonly closedDrawn: (board: number) => string;
  readonly showAll: string;
  readonly defaultName: (index: number) => string;
  readonly draws: string;
  readonly score: string;
  readonly rematch: string;
  readonly undo: string;
  readonly settings: {
    readonly open: string;
    readonly title: string;
    readonly close: string;
    readonly players: string;
    readonly playerName: (index: number) => string;
    readonly language: string;
    readonly motion: string;
    readonly motionSystem: string;
    readonly motionFull: string;
    readonly motionReduced: string;
    readonly autoZoom: string;
    readonly autoZoomHint: string;
    readonly hints: string;
    readonly hintsHint: string;
    readonly design: string;
    readonly designs: { readonly departures: string; readonly 'departures-contrast': string };
    readonly newSeries: string;
    readonly confirmNewSeries: string;
  };
}

export const MESSAGES: Record<Lang, Messages> = {
  es: {
    langName: 'Español',
    flap: { free: 'LIBRE', wins: 'GANA', draw: 'TABLAS' },
    departureLabel: 'Siguiente turno',
    opening:
      'Gana quien cierre tres tableros en línea. La casilla que juegues decide en qué tablero juega tu rival. Empieza donde quieras.',
    forced: (mover, cell, next) =>
      `${mover} jugó la casilla ${cell}, así que ${next} juega en el tablero ${cell}.`,
    freeChoice: (mover, cell, next) =>
      `${mover} jugó la casilla ${cell}, pero el tablero ${cell} está cerrado: ${next} elige tablero.`,
    preview: (next, board) =>
      board === null
        ? `Si juegas aquí, ${next} elegirá tablero.`
        : `Si juegas aquí, ${next} irá al tablero ${board}.`,
    rejected: (reason, board) => {
      switch (reason) {
        case 'wrong-board':
          return `Ahora toca jugar en el tablero ${board ?? ''}.`;
        case 'board-closed':
          return 'Ese tablero ya está cerrado: elige uno abierto.';
        case 'cell-occupied':
          return 'Esa casilla ya está ocupada.';
        case 'game-over':
          return 'La partida ha terminado: pulsa Revancha para jugar otra.';
        case 'invalid-coordinates':
          return 'Esa jugada no existe en el tablero.';
      }
    },
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
    openBoard: (board) => `Abrir el tablero ${board}`,
    cell: (board, cell, mark) => `Tablero ${board}, casilla ${cell}, ${mark ?? 'vacía'}`,
    closedWon: (board, winner) => `Tablero ${board}, ganado por ${winner}`,
    closedDrawn: (board) => `Tablero ${board}, en tablas`,
    showAll: 'Ver todos',
    defaultName: (index) => `Jugador ${index}`,
    draws: 'Tablas',
    score: 'Marcador de la serie',
    rematch: 'Revancha',
    undo: 'Deshacer',
    settings: {
      open: 'Ajustes',
      title: 'Ajustes',
      close: 'Cerrar ajustes',
      players: 'Jugadores',
      playerName: (index) => `Nombre del jugador ${index}`,
      language: 'Idioma',
      motion: 'Animaciones',
      motionSystem: 'Como el sistema',
      motionFull: 'Completas',
      motionReduced: 'Reducidas',
      autoZoom: 'Abrir el tablero obligatorio',
      autoZoomHint: 'En pantallas estrechas, tras cada jugada.',
      hints: 'Ayudas',
      hintsHint: 'Números de casilla y adónde enviarías al rival.',
      design: 'Diseño',
      designs: { departures: 'Salidas', 'departures-contrast': 'Salidas · alto contraste' },
      newSeries: 'Nueva serie',
      confirmNewSeries: 'Borrar marcador y empezar',
    },
  },
  en: {
    langName: 'English',
    flap: { free: 'FREE', wins: 'WINS', draw: 'DRAW' },
    departureLabel: 'Next turn',
    opening:
      'Close three boards in a row to win. The cell you play decides which board your opponent plays next. Start anywhere.',
    forced: (mover, cell, next) =>
      `${mover} played cell ${cell}, so ${next} plays on board ${cell}.`,
    freeChoice: (mover, cell, next) =>
      `${mover} played cell ${cell}, but board ${cell} is closed: ${next} picks a board.`,
    preview: (next, board) =>
      board === null
        ? `If you play here, ${next} picks a board.`
        : `If you play here, ${next} goes to board ${board}.`,
    rejected: (reason, board) => {
      switch (reason) {
        case 'wrong-board':
          return `This turn is played on board ${board ?? ''}.`;
        case 'board-closed':
          return 'That board is already closed: pick an open one.';
        case 'cell-occupied':
          return 'That cell is already taken.';
        case 'game-over':
          return 'The game is over: press Rematch to play again.';
        case 'invalid-coordinates':
          return 'That move is not on the board.';
      }
    },
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
    openBoard: (board) => `Open board ${board}`,
    cell: (board, cell, mark) => `Board ${board}, cell ${cell}, ${mark ?? 'empty'}`,
    closedWon: (board, winner) => `Board ${board}, won by ${winner}`,
    closedDrawn: (board) => `Board ${board}, drawn`,
    showAll: 'Show all',
    defaultName: (index) => `Player ${index}`,
    draws: 'Draws',
    score: 'Series score',
    rematch: 'Rematch',
    undo: 'Undo',
    settings: {
      open: 'Settings',
      title: 'Settings',
      close: 'Close settings',
      players: 'Players',
      playerName: (index) => `Player ${index} name`,
      language: 'Language',
      motion: 'Animations',
      motionSystem: 'Follow the system',
      motionFull: 'Full',
      motionReduced: 'Reduced',
      autoZoom: 'Open the forced board',
      autoZoomHint: 'On narrow screens, after each move.',
      hints: 'Hints',
      hintsHint: 'Cell numbers and where you would send your opponent.',
      design: 'Design',
      designs: { departures: 'Departures', 'departures-contrast': 'Departures · high contrast' },
      newSeries: 'New series',
      confirmNewSeries: 'Clear the score and start',
    },
  },
};
