import type { Move } from '@core';
import type { OpponentRequest } from './opponent-request.model';

/** Main thread → Worker: one request, tagged so its reply can be matched. */
export interface OpponentRequestMessage extends OpponentRequest {
  readonly id: number;
}

/** Worker → main thread: the reply to request `id`, or why there is none. */
export type OpponentReplyMessage =
  | { readonly id: number; readonly move: Move | null }
  | { readonly id: number; readonly error: string };
