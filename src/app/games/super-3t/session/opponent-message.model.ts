import type { Move } from '@super3t/core';
import type { OpponentRequest } from '@match';

/** Main thread → Worker: one request, tagged so its reply can be matched. */
export interface OpponentRequestMessage extends OpponentRequest<Move> {
  readonly id: number;
}

/** Worker → main thread: the reply to request `id`, or why there is none. */
export type OpponentReplyMessage =
  | { readonly id: number; readonly move: Move | null }
  | { readonly id: number; readonly error: string };
