/** An X as one SVG path: the two strokes of radius `r` through (cx, cy). */
export function crossPath(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy - r}L${cx + r} ${cy + r}M${cx + r} ${cy - r}L${cx - r} ${cy + r}`;
}
