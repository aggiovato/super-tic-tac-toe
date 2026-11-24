import type { Route } from '@angular/router';
import type { GameId } from '@catalog';
import { HistoryTicket } from './history-ticket/history-ticket';

/**
 * The history of a game as a child of its game route (`/<game>/history`, also inside an online
 * room): the game stays rendered under the ticket. `overlay` tells the page transition to stay out.
 */
export const historyRoute = (gameId: GameId): Route => ({
  path: 'history',
  component: HistoryTicket,
  data: { gameId, overlay: true },
});
