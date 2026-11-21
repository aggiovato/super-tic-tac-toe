/** Distance in px a drag must travel before it counts, so taps on the handle's buttons still work. */
const SLOP = 8;
/** Share of the sheet's height past which releasing closes it. */
const CLOSE_RATIO = 0.25;
/** A quick flick closes it whatever the distance (px per ms). */
const FLICK_SPEED = 0.6;

/**
 * Lets a bottom sheet be dragged down by its `handle` and closed by releasing it far or fast enough;
 * otherwise it springs back. Only while `active()` (e.g. on narrow screens). The sheet's own CSS
 * transition animates the close and the spring back from wherever the finger left it.
 * Returns a cleanup function.
 */
export function swipeToClose(
  handle: HTMLElement,
  sheet: HTMLElement,
  close: () => void,
  active: () => boolean,
): () => void {
  let start: { y: number; time: number; id: number } | null = null;
  let dragging = false;
  let offset = 0;

  const release = (event: PointerEvent): void => {
    if (start?.id !== event.pointerId) {
      return;
    }
    const speed = offset / Math.max(1, event.timeStamp - start.time);
    const closing = dragging && (offset > sheet.offsetHeight * CLOSE_RATIO || speed > FLICK_SPEED);
    start = null;
    if (!dragging) {
      return;
    }
    dragging = false;
    // Hand the position back to the stylesheet: its transition runs from the dragged offset.
    sheet.style.transition = '';
    sheet.style.translate = '';
    if (closing) {
      close();
    }
  };

  const down = (event: PointerEvent): void => {
    if (active() && event.isPrimary && event.button === 0) {
      start = { y: event.clientY, time: event.timeStamp, id: event.pointerId };
      offset = 0;
    }
  };

  const move = (event: PointerEvent): void => {
    if (start?.id !== event.pointerId) {
      return;
    }
    offset = Math.max(0, event.clientY - start.y);
    if (!dragging && offset > SLOP) {
      dragging = true;
      handle.setPointerCapture(event.pointerId);
      sheet.style.transition = 'none';
    }
    if (dragging) {
      sheet.style.translate = `0 ${offset}px`;
    }
  };

  handle.addEventListener('pointerdown', down);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);
  return () => {
    handle.removeEventListener('pointerdown', down);
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', release);
    handle.removeEventListener('pointercancel', release);
  };
}
