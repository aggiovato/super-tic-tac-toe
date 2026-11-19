/// <reference lib="webworker" />
// Worker entry: runs the opponent off the UI thread. Rebuilds the position from the moves, so a
// request carries no state that could drift from the engine's.
import { chooseMove } from '@ai';
import { replay, RULES_VERSION } from '@core';
import type { OpponentReplyMessage, OpponentRequestMessage } from './opponent-message.model';

addEventListener('message', ({ data }: MessageEvent<OpponentRequestMessage>) => {
  const { id, moves, level, seed } = data;
  let reply: OpponentReplyMessage;
  try {
    const game = replay(moves, RULES_VERSION);
    reply = game.ok
      ? { id, move: chooseMove(game.state, { level, seed }) }
      : { id, error: `The moves do not replay: ${game.reason}` };
  } catch (error) {
    reply = { id, error: error instanceof Error ? error.message : String(error) };
  }
  postMessage(reply);
});
