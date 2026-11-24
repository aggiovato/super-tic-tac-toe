import { CHAT_MAX } from '@protocol';
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
 * Characters never part of what a player writes: controls (the line break is kept) and invisible
 * format characters that hide or reorder text (direction overrides, zero widths), but the zero-width
 * joiner and tag characters emoji are built with.
 */
const HIDDEN = /[\p{Cc}\p{Cf}]/gu;
const KEPT = new Set(['\n', '\u200D']);
const isEmojiTag = (char: string) => {
  const code = char.codePointAt(0) ?? 0;
  return code >= 0xe0020 && code <= 0xe007f;
};

/**
 * A chat message: line and paragraph separators read as line breaks, hidden characters go, at most
 * two line breaks stay in a row, and the text is trimmed; one that is then empty or longer than
 * `CHAT_MAX` characters cannot be kept (`invalid-say`, named by its `clientId`).
 */
function parseSay(clientId: unknown, text: unknown): ReadMessage | null {
  if (typeof clientId !== 'string' || !COMMAND_ID.test(clientId)) {
    return null;
  }
  if (typeof text !== 'string') {
    return { type: 'invalid-say', clientId };
  }
  const clean = text
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(HIDDEN, (char) => (KEPT.has(char) || isEmojiTag(char) ? char : ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const length = [...clean].length;
  return length === 0 || length > CHAT_MAX
    ? { type: 'invalid-say', clientId }
    : { type: 'say', clientId, text: clean };
}
