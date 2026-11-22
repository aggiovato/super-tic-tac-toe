/// <reference lib="webworker" />
// Worker entry: runs the Dots and Boxes opponent off the UI thread (its endgame search can take
// the whole 600 ms budget). Rebuilds the position from the moves and the board size.
import { chooseMove } from '@dots/ai';
import { type Move, replay, RULES_VERSION } from '@dots/core';
import type { ComputerReplyMessage, ComputerRequestMessage } from '@match';

addEventListener('message', ({ data }: MessageEvent<ComputerRequestMessage<Move>>) => {
  const { id, moves, level, seed, variant } = data;
  let reply: ComputerReplyMessage<Move>;
  try {
    const game = replay(moves, RULES_VERSION, variant);
    reply = game.ok
      ? { id, move: chooseMove(game.state, { level, seed }) }
      : { id, error: `The moves do not replay: ${game.reason}` };
  } catch (error) {
    reply = { id, error: error instanceof Error ? error.message : String(error) };
  }
  postMessage(reply);
});
