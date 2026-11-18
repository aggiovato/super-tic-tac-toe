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
};
