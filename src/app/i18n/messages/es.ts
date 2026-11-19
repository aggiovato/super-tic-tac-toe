import type { Messages } from '../messages.model';

/** Spanish: the default for browsers set to any Spanish locale. */
export const es: Messages = {
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
  opponent: 'Rival',
  draws: 'Tablas',
  score: 'Marcador de la serie',
  rematch: 'Revancha',
  undo: 'Deshacer',
  settings: {
    open: 'Ajustes',
    title: 'Ajustes',
    close: 'Cerrar ajustes',
    mode: 'Modo de juego',
    modes: { humans: 'Dos personas', opponent: 'Contra el rival' },
    level: 'Nivel del rival',
    levels: { beginner: 'Principiante', intermediate: 'Intermedio' },
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
    confirmModeChange: 'Cambiar y borrar marcador',
  },
};
