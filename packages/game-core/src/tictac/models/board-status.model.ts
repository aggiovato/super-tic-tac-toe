import type { Line } from './line.model';
import type { Player } from './player.model';

export type BoardStatus =
  | { readonly kind: 'open' }
  | { readonly kind: 'won'; readonly winner: Player; readonly line: Line }
  | { readonly kind: 'drawn' };
