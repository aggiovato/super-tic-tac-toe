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
  opponents: { beginner: 'Cercanías', intermediate: 'Regional', advanced: 'Expreso' },
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
  save: {
    saving: 'Guardando…',
    saved: 'Guardado',
    quota: 'No queda espacio en este dispositivo para guardar la partida.',
    failed: 'No se pudo guardar la partida.',
    unavailable: 'Este navegador no guarda partidas: esta se perderá al cerrar.',
    conflict: 'Esta partida siguió en otra pestaña.',
    retry: 'Reintentar',
    reload: 'Recargar',
  },
  update: {
    available: 'Hay una versión nueva de la app.',
    apply: 'Actualizar',
    unsaved:
      'Hay una versión nueva, pero la partida no está guardada: si actualizas, se perderán las últimas jugadas.',
    applyAnyway: 'Actualizar igualmente',
    applying: 'Actualizando…',
  },
  history: {
    open: 'Historial',
    title: (game) => `Historial de ${game}`,
    back: 'Volver a la partida',
    byLevel: 'Contra el rival',
    level: 'Nivel',
    wins: 'Victorias',
    draws: 'Tablas',
    losses: 'Derrotas',
    humans: (count) =>
      count === 1 ? '1 partida a dos personas.' : `${count} partidas a dos personas.`,
    recent: 'Últimas partidas',
    empty: (game) => `Aún no has terminado ninguna partida de ${game}.`,
    won: 'Ganaste',
    lost: 'Perdiste',
    draw: 'Tablas',
    winner: (name) => `Gana ${name}`,
    moves: (count) => `${count} jugadas`,
    board: (variant) => `${variant}×${variant}`,
  },
  dots: {
    flapTurn: 'JUEGA',
    opening:
      'Traza una línea entre dos puntos vecinos. Quien cierra una caja se la queda y vuelve a jugar.',
    drew: (mover, next) => `${mover} trazó una línea. Turno de ${next}.`,
    closed: (mover, boxes) =>
      boxes === 1
        ? `${mover} cerró una caja y vuelve a jugar.`
        : `${mover} cerró ${boxes} cajas y vuelve a jugar.`,
    won: (winner, theirs, others) => `${winner} gana por ${theirs} cajas a ${others}.`,
    drawn: 'Tablas: las mismas cajas para cada uno.',
    rejected: (reason) =>
      reason === 'line-taken'
        ? 'Esa línea ya está trazada.'
        : reason === 'game-over'
          ? 'La partida ha terminado: pulsa Revancha para jugar otra.'
          : 'Esa línea no existe en el tablero.',
    status: {
      turn: (next) => `Turno de ${next}.`,
      won: (winner) => `Partida terminada. Gana ${winner}.`,
      drawn: 'Partida terminada en tablas.',
    },
    tallyStatus: (x, o) => `Cajas: X ${x}, O ${o}.`,
    board: 'Tablero de puntos',
    line: (orientation, row, col, owner) =>
      (orientation === 'h'
        ? `Línea horizontal, fila ${row}, puntos ${col} y ${col + 1}`
        : `Línea vertical, columna ${col}, puntos ${row} y ${row + 1}`) +
      (owner ? `, de ${owner}` : ', libre'),
    size: 'Tablero',
    sizeName: (boxes) => `${boxes}×${boxes} cajas`,
    confirmSize: 'Cambiar y borrar marcador',
    howToPlay: {
      title: 'Cómo se juega',
      intro: 'Puntos y cajas: gana quien cierre más cajas.',
      draw: 'En tu turno, traza una línea entre dos puntos vecinos, en horizontal o en vertical.',
      close: 'Si tu línea cierra el cuarto lado de una caja, es tuya y vuelves a jugar.',
      careful: 'Ojo con el tercer lado: le dejas la caja a tu rival.',
      win: 'Cuando se trazan todas las líneas, gana quien tenga más cajas.',
    },
  },
  games: { 'super-3t': 'Super 3T', classic: 'Clásico', dots: 'Cajas' },
  online: {
    title: 'Online',
    invite: 'Invitar a alguien online',
    inviteHint:
      'Crea una sala privada y comparte su enlace: la partida se juega en dos dispositivos.',
    creating: 'Creando sala…',
    createFailed: 'No se pudo crear la sala. Comprueba la conexión y prueba otra vez.',
    you: 'Tú',
    rival: 'Rival',
    waitingHint: 'Comparte este enlace para que se una:',
    link: 'Enlace de la sala',
    share: 'Compartir enlace',
    copy: 'Copiar enlace',
    copied: 'Enlace copiado',
    shareText: (game) => `¿Una partida de ${game}?`,
    connecting: 'Conectando…',
    reconnecting: 'Sin conexión. Reintentando…',
    rivalAway: 'Tu rival se ha desconectado. Le esperamos.',
    leave: 'Salir de la sala',
    retry: 'Reintentar',
    playHere: 'Jugar en este dispositivo',
    left: 'Saliste de esta sala.',
    leftHint:
      'Tu asiento sigue guardado mientras la sala exista. Al volver, tu rival te verá conectado.',
    rejoin: 'Volver a la sala',
    here: 'conectado',
    away: 'sin conexión',
    notYet: 'aún no ha entrado',
    problems: {
      missing: 'Esta sala no existe. Puede que el enlace esté incompleto.',
      full: 'Esta sala ya tiene dos jugadores.',
      expired: 'La sala caducó tras una semana sin jugar.',
      unreachable: 'No hay conexión con el servidor.',
    },
  },
  library: {
    open: 'Juegos',
    title: 'Juegos',
    close: 'Cerrar juegos',
    hide: 'Ocultar juegos',
    show: 'Mostrar juegos',
    playing: 'En juego',
    blurbs: {
      'super-3t': 'Nueve tableros en uno: cada jugada decide dónde juega el rival.',
      classic: 'El tres en raya de siempre, contra otra persona o la máquina.',
      dots: 'Une puntos, cierra cajas y vuelve a jugar.',
    },
  },
  settings: {
    open: 'Ajustes',
    title: 'Ajustes',
    close: 'Cerrar ajustes',
    mode: 'Modo de juego',
    modes: { local: 'Dos personas', computer: 'Contra el rival' },
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
    sections: 'Secciones de ajustes',
    sectionNames: { game: 'Partida', app: 'Aplicación' },
  },
};
