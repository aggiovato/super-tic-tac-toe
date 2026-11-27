import { cleanChatText } from '@protocol';
import type { ClientMessage } from '../models';

/**
 * What a socket sent, read: a client message, a chat message whose text cannot be kept (its
 * `clientId` known, so the refusal can name it), or null for anything else.
 */
export type ReadMessage =
  ClientMessage | { readonly type: 'invalid-say'; readonly clientId: string };

/** The longest message a client may send, in characters. */
export const MAX_MESSAGE = 4096;
const COMMAND_ID = /^[\w-]{1,64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A client message, or null for anything that is not one. */
export function parseClientMessage(raw: string): ReadMessage | null {
  if (raw.length > MAX_MESSAGE) {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data)) {
    return null;
  }
  if (data['type'] === 'sync') {
    return { type: 'sync' };
  }
  if (data['type'] === 'rematch' && Number.isInteger(data['game'])) {
    return { type: 'rematch', game: data['game'] as number };
  }
  if (data['type'] === 'say') {
    return parseSay(data['clientId'], data['text']);
  }
  const { commandId, expectedRevision, move } = data;
  if (
    data['type'] === 'move' &&
    typeof commandId === 'string' &&
    COMMAND_ID.test(commandId) &&
    Number.isInteger(expectedRevision) &&
    (expectedRevision as number) >= 0 &&
    isRecord(move)
  ) {
    return { type: 'move', commandId, expectedRevision: expectedRevision as number, move };
  }
  return null;
}

/**
 * A chat message: its text cleaned by the rule both ends share (`cleanChatText`); one that cannot be
 * kept (empty, or longer than `CHAT_MAX`) is `invalid-say`, named by its `clientId`.
 */
function parseSay(clientId: unknown, text: unknown): ReadMessage | null {
  if (typeof clientId !== 'string' || !COMMAND_ID.test(clientId)) {
    return null;
  }
  const clean = typeof text === 'string' ? cleanChatText(text) : null;
  return clean === null
    ? { type: 'invalid-say', clientId }
    : { type: 'say', clientId, text: clean };
}
