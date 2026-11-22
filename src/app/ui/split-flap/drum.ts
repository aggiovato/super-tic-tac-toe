/**
 * Letters and digits on the drum, in order. A tile cycles through these on its way to a new
 * character. Glyphs (`x` and `o` for the players, drawn as the board's marks so they never read as a
 * letter or a zero; `→`; `=`) are never cycled through: they only appear as the final character.
 */
const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ0123456789';

/** Characters shown on the way from `from` to `to`, ending on `to`, at most `max` long. */
export function drumPath(from: string, to: string, max: number): string[] {
  const start = Math.max(0, DRUM.indexOf(from));
  const end = DRUM.indexOf(to);
  const steps = Math.max(1, max);
  if (end < 0) {
    // A glyph: spin a few drum characters, then land on it.
    return [
      ...Array.from({ length: steps - 1 }, (_, i) => DRUM[(start + i + 1) % DRUM.length] ?? ' '),
      to,
    ];
  }
  const distance = (end - start + DRUM.length) % DRUM.length;
  const count = Math.min(Math.max(distance, 1), steps);
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? to : (DRUM[(end - (count - 1 - i) + DRUM.length) % DRUM.length] ?? to),
  );
}
