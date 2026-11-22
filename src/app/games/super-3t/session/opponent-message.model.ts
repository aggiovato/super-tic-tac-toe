import type { OpponentReplyMessage as Reply, OpponentRequestMessage as Request } from '@match';
import type { Move } from '@super3t/core';

/** Main thread → Worker: one request, tagged so its reply can be matched. */
export type OpponentRequestMessage = Request<Move>;

/** Worker → main thread: the reply to request `id`, or why there is none. */
export type OpponentReplyMessage = Reply<Move>;
