import type { ClientMessage } from '../models';

/** The longest message a client may send, in characters. */
export const MAX_MESSAGE = 4096;
const COMMAND_ID = /^[\w-]{1,64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A client message, or null for anything that is not one. */
export function parseClientMessage(raw: string): ClientMessage | null {
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
