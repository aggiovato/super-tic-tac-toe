import { CHAT_MAX } from './protocol.model';

/**
 * Characters never part of what a player writes: controls (the line break is kept) and invisible
 * format characters that hide or reorder text (direction overrides, zero widths), but the zero-width
 * joiner and tag characters emoji are built with.
 */
const HIDDEN = /(?!\n|\u200D|[\u{E0020}-\u{E007F}])[\p{Cc}\p{Cf}]/gu;

/**
 * A chat message as the room keeps it, the same rule at both ends: line and paragraph separators
 * read as line breaks, hidden characters go, at most two line breaks stay in a row, and the text is
 * trimmed. Null when it is then empty or longer than `CHAT_MAX` characters (code points).
 */
export function cleanChatText(text: string): string | null {
  const clean = text
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(HIDDEN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const length = [...clean].length;
  return length === 0 || length > CHAT_MAX ? null : clean;
}
