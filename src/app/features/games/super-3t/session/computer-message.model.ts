import type {
  ComputerReplyMessage as Reply,
  ComputerRequestMessage as Request,
} from '@match/worker';
import type { Move } from '@super3t/core';

/** Main thread → Worker: one request, tagged so its reply can be matched. */
export type ComputerRequestMessage = Request<Move>;

/** Worker → main thread: the reply to request `id`, or why there is none. */
export type ComputerReplyMessage = Reply<Move>;
