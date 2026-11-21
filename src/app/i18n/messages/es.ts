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
  howToPlay: {
    title: 'Cómo se juega',
    intro: 'Un tres en raya hecho de nueve tres en raya.',
    board:
      'Haz tres en raya dentro de un tablero pequeño y es tuyo. Si se llena sin línea, queda en tablas y no es de nadie.',
    destination:
      'Tu casilla elige el tablero de tu rival: la de arriba a la derecha le manda al de arriba a la derecha.',
    target:
      'Juega siempre en el tablero marcado en naranja. Si te mandan a uno ya cerrado, eliges tú cualquier tablero abierto.',
    win: 'Gana la partida quien consiga tres tableros en línea.',
    guide: 'El letrero de arriba te dice en todo momento a quién le toca y dónde.',
    practise: 'Practica con un reto táctico',
    play: 'Jugar',
    skip: 'Saltar',
  },
  challenge: {
    title: 'Reto táctico',
    picker: 'Reto',
    levels: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
    solvedMark: ' ✓',
    goal: 'Juegas con X contra el rival (O). Mándalo a un tablero donde cualquier jugada suya te regale la partida: ganas en dos jugadas.',
    findKey: 'Busca la jugada clave.',
    defending: 'El rival busca una salida…',
    finish: '¡Esa era! El rival no tiene salida: cierra la partida.',
    saved: (board, cell) =>
      `El rival se salvaría jugando en el tablero ${board}, casilla ${cell}. Prueba otra jugada.`,
    missed: 'Tenías la partida y se escapó: había una jugada que ganaba. Reinténtalo.',
    solved: '¡Reto resuelto!',
    retry: 'Reintentar',
    next: 'Siguiente reto',
    exit: 'Volver a la partida',
  },
  classic: {
    flapTurn: 'JUEGA',
    opening: 'Tres en raya: el primero que consiga tres en línea gana. Empieza X.',
    played: (mover, cell, next) => `${mover} jugó la casilla ${cell}. Turno de ${next}.`,
    won: (winner) => `${winner} gana con tres en línea.`,
    drawn: 'Tablas: el tablero está lleno y nadie hizo línea.',
    rejected: (reason) =>
      reason === 'cell-occupied'
        ? 'Esa casilla ya está ocupada.'
        : reason === 'game-over'
          ? 'La partida ha terminado: pulsa Revancha para jugar otra.'
          : 'Esa jugada no existe en el tablero.',
    status: {
      turn: (next) => `Turno de ${next}.`,
      won: (winner) => `Partida terminada. Gana ${winner}.`,
      drawn: 'Partida terminada en tablas.',
    },
    board: 'Tablero',
    cell: (cell, mark) => `Casilla ${cell}, ${mark ?? 'vacía'}`,
  },
  games: { 'super-3t': 'Super 3T', classic: 'Clásico' },
  settings: {
    open: 'Ajustes',
    title: 'Ajustes',
    close: 'Cerrar ajustes',
    mode: 'Modo de juego',
    modes: { humans: 'Dos personas', opponent: 'Contra el rival' },
    level: 'Nivel del rival',
    levels: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
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
    howToPlay: 'Cómo se juega',
    challenges: 'Retos tácticos',
    confirmChallenges: 'Ir y dejar esta partida',
    game: 'Juego',
    confirmSwitchGame: 'Cambiar y dejar esta partida',
    sections: 'Secciones de ajustes',
    sectionNames: { game: 'Partida', app: 'Aplicación' },
  },
};
