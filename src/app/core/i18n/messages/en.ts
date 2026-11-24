import type { Messages } from '../messages.model';

/** English: the default for every other locale. */
export const en: Messages = {
  langName: 'English',
  flap: { free: 'FREE', wins: 'WINS', draw: 'DRAW' },
  departureLabel: 'Next turn',
  opening:
    'Close three boards in a row to win. The cell you play decides which board your opponent plays next. Start anywhere.',
  forced: (mover, cell, next) => `${mover} played cell ${cell}, so ${next} plays on board ${cell}.`,
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
  opponent: 'Opponent',
  opponents: { beginner: 'Rookie', intermediate: 'Veteran', advanced: 'Master' },
  draws: 'Draws',
  score: 'Series score',
  rematch: 'Rematch',
  undo: 'Undo',
  howToPlay: {
    title: 'How to play',
    intro: 'A tic tac toe made of nine tic tac toes.',
    board:
      'Get three in a row inside a small board and it is yours. If it fills up with no line, it is a draw and belongs to nobody.',
    destination:
      'Your cell picks the board your opponent plays next: the top-right cell sends them to the top-right board.',
    target:
      'Always play on the board marked in orange. If you are sent to a board that is already closed, pick any open board.',
    win: 'Whoever gets three boards in a line wins the game.',
    guide: 'The flap row at the top always tells you whose turn it is and where.',
    practise: 'Practise with a tactical challenge',
    play: 'Play',
    skip: 'Skip',
  },
  challenge: {
    title: 'Tactical challenge',
    picker: 'Challenge',
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    solvedMark: ' ✓',
    goal: 'You play X against the opponent (O). Send them to a board where any move of theirs hands you the game: you win in two moves.',
    findKey: 'Find the key move.',
    defending: 'The opponent looks for a way out…',
    finish: 'That was it! The opponent has no way out: close the game.',
    saved: (board, cell) =>
      `The opponent would hold out on board ${board}, cell ${cell}. Try another move.`,
    missed: 'The game was yours and it got away: one move won it. Try again.',
    solved: 'Challenge solved!',
    retry: 'Try again',
    next: 'Next challenge',
    exit: 'Back to the game',
  },
  classic: {
    flapTurn: 'PLAYS',
    opening: 'Tic tac toe: the first to get three in a line wins. X starts.',
    played: (mover, cell, next) => `${mover} played cell ${cell}. ${next} to move.`,
    won: (winner) => `${winner} wins with three in a line.`,
    drawn: 'Draw: the board is full and nobody made a line.',
    rejected: (reason) =>
      reason === 'cell-occupied'
        ? 'That cell is already taken.'
        : reason === 'game-over'
          ? 'The game is over: press Rematch to play another.'
          : 'That move is not on the board.',
    status: {
      turn: (next) => `${next} to move.`,
      won: (winner) => `Game over. ${winner} wins.`,
      drawn: 'Game over, a draw.',
    },
    board: 'Board',
    cell: (cell, mark) => `Cell ${cell}, ${mark ?? 'empty'}`,
  },
  save: {
    saving: 'Saving…',
    saved: 'Saved',
    quota: 'There is no room left on this device to save the game.',
    failed: 'The game could not be saved.',
    unavailable: 'This browser does not keep games: this one will be lost when you close it.',
    conflict: 'This game went on in another tab.',
    retry: 'Try again',
    reload: 'Reload',
  },
  update: {
    available: 'A new version of the app is ready.',
    apply: 'Update',
    unsaved:
      'A new version is ready, but this game is not saved: updating now loses its last moves.',
    applyAnyway: 'Update anyway',
    applying: 'Updating…',
  },
  history: {
    open: 'History',
    title: (game) => `${game} history`,
    back: 'Back to the game',
    sections: 'History sections',
    results: 'Results',
    byLevel: 'Against the opponent',
    level: 'Level',
    wins: 'Wins',
    draws: 'Draws',
    losses: 'Losses',
    humans: (count) => (count === 1 ? '1 game for two people.' : `${count} games for two people.`),
    recent: 'Latest departures',
    empty: (game) => `You have not finished a game of ${game} yet.`,
    won: 'You won',
    lost: 'You lost',
    draw: 'Draw',
    winner: (name) => `${name} wins`,
    moves: (count) => `${count} moves`,
    board: (variant) => `${variant}×${variant}`,
    totals: (wins, draws, losses) =>
      `Against the opponent: ${wins} wins, ${draws} draws and ${losses} losses.`,
    flapResult: { won: 'W', drawn: 'D', lost: 'L' },
    strip: (count) =>
      count === 1 ? "The latest game's result" : `The latest ${count} games' results`,
    playFirst: 'Play the first one',
    error: 'The history on this device could not be read.',
    onlineNote: 'Online games are not kept on this device and do not count here.',
    form: 'Form by level',
    formHint: 'The latest games against each level, oldest first.',
    formRow: (name, wins, draws, losses) =>
      `${name}: ${wins} wins, ${draws} draws and ${losses} losses in the latest games.`,
    length: 'Moves per game',
    lengthLabel: (count, least, most) =>
      `The latest ${count} games lasted between ${least} and ${most} moves.`,
    legend: { won: 'Won', drawn: 'Draw', lost: 'Lost', people: 'Two people' },
  },
  dots: {
    flapTurn: 'PLAYS',
    opening: 'Draw a line between two neighbouring dots. Close a box to keep it and play again.',
    drew: (mover, next) => `${mover} drew a line. ${next} to move.`,
    closed: (mover, boxes) =>
      boxes === 1
        ? `${mover} closed a box and plays again.`
        : `${mover} closed ${boxes} boxes and plays again.`,
    won: (winner, theirs, others) => `${winner} wins ${theirs} boxes to ${others}.`,
    drawn: 'Draw: the same number of boxes each.',
    rejected: (reason) =>
      reason === 'line-taken'
        ? 'That line is already drawn.'
        : reason === 'game-over'
          ? 'The game is over: press Rematch to play another.'
          : 'That line is not on the board.',
    status: {
      turn: (next) => `${next} to move.`,
      won: (winner) => `Game over. ${winner} wins.`,
      drawn: 'Game over, a draw.',
    },
    tallyStatus: (x, o) => `Boxes: X ${x}, O ${o}.`,
    board: 'Dot board',
    line: (orientation, row, col, owner) =>
      (orientation === 'h'
        ? `Horizontal line, row ${row}, dots ${col} and ${col + 1}`
        : `Vertical line, column ${col}, dots ${row} and ${row + 1}`) +
      (owner ? `, ${owner}'s` : ', free'),
    size: 'Board',
    sizeName: (boxes) => `${boxes}×${boxes} boxes`,
    confirmSize: 'Switch and clear the score',
    howToPlay: {
      title: 'How to play',
      intro: 'Dots and Boxes: whoever closes more boxes wins.',
      draw: 'On your turn, draw a line between two neighbouring dots, across or down.',
      close: 'If your line closes the fourth side of a box, it is yours and you play again.',
      careful: 'Mind the third side: it hands the box to your opponent.',
      win: 'Once every line is drawn, whoever holds more boxes wins.',
    },
  },
  fleet: {
    flap: {
      water: 'MISS',
      hit: 'HIT',
      sunk: 'SUNK',
      fleet: 'FLEET',
      fire: 'FIRE',
      won: 'VICTORY',
      lost: 'DEFEAT',
    },
    placing: 'Tap a ship, then its new spot; turn it or shuffle, then confirm.',
    waitingFleet: (rival) => `Waiting for ${rival} to place their fleet.`,
    yourTurn: 'Your turn: pick a cell in the enemy waters.',
    aiming: (cell) => `Aiming at ${cell}. Tap again or press Fire.`,
    aimingAfterMiss: (rival, missed, cell) =>
      `${rival} missed at ${missed}. Aiming at ${cell}: tap again or press Fire.`,
    pending: (cell) => `Shot at ${cell} on its way…`,
    yourShot: (cell, outcome, ship) =>
      outcome === 'water'
        ? `${cell}: miss. The rival's turn.`
        : outcome === 'hit'
          ? `${cell}: hit. Fire again.`
          : `${cell}: sunk! It was their ${ship}. Fire again.`,
    rivalShot: (rival, cell, outcome, ship) =>
      outcome === 'water'
        ? `${rival} fires at ${cell}: miss. Your turn.`
        : outcome === 'hit'
          ? `${rival} hits you at ${cell} and fires again.`
          : `${rival} sinks your ${ship} at ${cell} and fires again.`,
    won: (rival) => `You sank ${rival}'s whole fleet.`,
    lost: (rival) => `${rival} sank your whole fleet.`,
    rejected: (reason) =>
      reason === 'already-shot'
        ? 'You already fired at that cell.'
        : reason === 'game-over'
          ? 'The game is over: press Rematch to play another.'
          : reason === 'invalid-fleet'
            ? 'That fleet will not do: check that no ship touches another.'
            : reason === 'pending'
              ? 'Wait to learn what your last shot did.'
              : reason === 'placing'
                ? 'A fleet is still to be placed.'
                : 'That move is not possible now.',
    problem: (problem) =>
      problem === 'touching'
        ? 'Ships may not touch, not even corner to corner.'
        : problem === 'overlap'
          ? 'Two ships cannot share a cell.'
          : problem === 'out-of-bounds'
            ? 'The ship runs off the board.'
            : 'Ships are missing from the fleet.',
    ships: {
      carrier: 'carrier',
      battleship: 'battleship',
      cruiser: 'cruiser',
      submarine: 'submarine',
      destroyer: 'destroyer',
    },
    rivalFleet: 'Rival fleet',
    yourFleet: 'Your fleet',
    afloat: (count) => `${count} afloat`,
    rivalWaters: 'Enemy waters',
    yourWaters: 'Your waters',
    cell: (cell, state) =>
      `${cell}, ${
        {
          unknown: 'not fired at',
          water: 'miss',
          hit: 'hit',
          sunk: 'sunk',
          pending: 'shot on its way',
          ship: 'ship',
          shipHit: 'ship hit',
        }[state]
      }`,
    shipState: (ship, length, hits, sunk) =>
      sunk
        ? `${ship}, ${length} cells, sunk`
        : `${ship}, ${length} cells${hits > 0 ? `, ${hits} hit` : ''}`,
    fire: 'Fire',
    lookAtOwn: 'Show your waters full size',
    lookAtRival: 'Back to the enemy waters',
    shuffle: 'Shuffle',
    rotate: 'Turn',
    confirmFleet: 'Confirm fleet',
    selected: (ship) => `${ship[0]?.toUpperCase() ?? ''}${ship.slice(1)} selected`,
    howToPlay: {
      title: 'How to play',
      intro: 'Sink the fleet: the first to sink all five rival ships wins.',
      place:
        'Place your fleet of 5, 4, 3, 3 and 2 cells. Ships never touch, not even corner to corner.',
      fire: 'On your turn, fire at a cell of the enemy waters: a miss, a hit or a sinking.',
      again: 'Hit or sink a ship and you fire again. A miss passes the turn.',
      win: "Sink the rival's five ships before they sink yours.",
    },
  },
  games: { 'super-3t': 'Super 3T', classic: 'Classic', dots: 'Boxes', fleet: 'Ship Sink' },
  online: {
    title: 'Online',
    invite: 'Invite someone online',
    inviteHint: 'Create a private room and share its link: the game is played on two devices.',
    creating: 'Creating the room…',
    createFailed: 'The room could not be created. Check the connection and try again.',
    you: 'You',
    rival: 'Rival',
    waitingHint: 'Share this link so they can join:',
    link: 'Room link',
    share: 'Share link',
    copy: 'Copy link',
    copied: 'Link copied',
    shareText: (game) => `A game of ${game}?`,
    connecting: 'Connecting…',
    reconnecting: 'Offline. Trying again…',
    rivalAway: 'Your rival lost the connection. Waiting for them.',
    leave: 'Leave the room',
    retry: 'Try again',
    playHere: 'Play on this device',
    left: 'You left this room.',
    leftHint: 'Your seat is kept while the room exists. Back in, your rival sees you connected.',
    rejoin: 'Back to the room',
    here: 'connected',
    away: 'offline',
    notYet: 'not in yet',
    problems: {
      missing: 'This room does not exist. The link may be incomplete.',
      full: 'This room already has two players.',
      expired: 'The room expired after a week without play.',
      unreachable: 'The server cannot be reached.',
    },
  },
  library: {
    open: 'Games',
    title: 'Games',
    close: 'Close games',
    hide: 'Hide games',
    show: 'Show games',
    playing: 'Playing',
    blurbs: {
      'super-3t': 'Nine boards in one: every move decides where your opponent plays.',
      classic: 'The tic tac toe you know, against a friend or the computer.',
      dots: 'Join the dots, close boxes and play again.',
      fleet: 'Sink the rival fleet before it sinks yours.',
    },
  },
  settings: {
    open: 'Settings',
    title: 'Settings',
    close: 'Close settings',
    mode: 'Who plays?',
    modes: { local: 'Two players', computer: 'Against the opponent' },
    onlineMode: 'Online room',
    level: 'Opponent level',
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    players: 'Names',
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
    confirmModeChange: 'Switch and clear the score',
    howToPlay: 'How to play',
    challenges: 'Tactical challenges',
    sections: 'Settings sections',
    sectionNames: { game: 'Game', players: 'Players', app: 'App' },
    confirmNewSeries: 'Clear the score and start',
  },
};
