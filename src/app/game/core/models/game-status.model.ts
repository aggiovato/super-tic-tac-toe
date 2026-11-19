import type { Line } from './line.model';
import type { Player } from './player.model';

export type GameStatus =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'won'; readonly winner: Player; readonly line: Line }
  | { readonly kind: 'drawn' };
