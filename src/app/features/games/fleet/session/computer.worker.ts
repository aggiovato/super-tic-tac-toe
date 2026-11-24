/// <reference lib="webworker" />
// Worker entry: runs the Ship Sink computer player off the UI thread. It rebuilds the whole game
// from the moves, then hands the computer only its own view: never the person's fleet.
import { chooseMove } from '@fleet/ai';
import { type Move, replay, RULES_VERSION, viewOf } from '@fleet/core';
import type { ComputerReplyMessage, ComputerRequestMessage } from '@match/worker';

addEventListener('message', ({ data }: MessageEvent<ComputerRequestMessage<Move>>) => {
  const { id, moves, level, seed, player } = data;
  let reply: ComputerReplyMessage<Move>;
  try {
    const game = replay(moves, RULES_VERSION);
    reply = game.ok
      ? { id, move: chooseMove(viewOf(game.state, player), { level, seed }) }
      : { id, error: `The moves do not replay: ${game.reason}` };
  } catch (error) {
    reply = { id, error: error instanceof Error ? error.message : String(error) };
  }
  postMessage(reply);
});
