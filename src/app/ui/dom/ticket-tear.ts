/**
 * Keeps `--tear-top` on `card` at the height of `head`: a sheet drawn as a ticket on phones cuts its
 * notches and its perforation where the head (the stub) ends, however tall the head turns out
 * (fonts, language, tabs). Returns the way to stop.
 */
export function trackTear(head: HTMLElement, card: HTMLElement): () => void {
  const set = () => card.style.setProperty('--tear-top', `${head.offsetHeight}px`);
  set();
  if (typeof ResizeObserver === 'undefined') {
    return () => undefined;
  }
  const observer = new ResizeObserver(set);
  observer.observe(head);
  return () => observer.disconnect();
}
