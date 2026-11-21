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
  games: { 'super-3t': 'Super 3T', classic: 'Classic' },
  settings: {
    open: 'Settings',
    title: 'Settings',
    close: 'Close settings',
    mode: 'Game mode',
    modes: { humans: 'Two players', opponent: 'Against the opponent' },
    level: 'Opponent level',
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
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
    confirmModeChange: 'Switch and clear the score',
    howToPlay: 'How to play',
    challenges: 'Tactical challenges',
    confirmChallenges: 'Go and leave this game',
    game: 'Game',
    confirmSwitchGame: 'Switch and leave this game',
    sections: 'Settings sections',
    sectionNames: { game: 'Game', app: 'App' },
    confirmNewSeries: 'Clear the score and start',
  },
};
