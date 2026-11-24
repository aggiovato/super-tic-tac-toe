import type { FlipOptions, Segment } from '@ui';
import { clampSegment, GAME_OVERSHOOT, overshoot } from './board-geometry';

/**
 * What the board reads from its rendered DOM: the win line over the grids, the platforms' slots and
 * the zoom motion tokens. Plain functions over the host element.
 */

/** The line through the centres of the boards `from` and `to`, in percent of the board. */
export function measureWinLine(host: HTMLElement, from: number, to: number): Segment | null {
  const board = host.querySelector<HTMLElement>('.board');
  if (!board) {
    return null;
  }
  const frame = board.getBoundingClientRect();
  const centre = (index: number) => {
    const grid = board.querySelector(`[data-cells="${index}"]`)?.getBoundingClientRect();
    return grid
      ? {
          x: ((grid.left + grid.width / 2 - frame.left) / frame.width) * 100,
          y: ((grid.top + grid.height / 2 - frame.top) / frame.height) * 100,
        }
      : null;
  };
  const a = centre(from);
  const b = centre(to);
  return a && b ? clampSegment(overshoot(a, b, GAME_OVERSHOOT)) : null;
}

export const slotElement = (host: HTMLElement, board: number): HTMLElement | null =>
  host.querySelector<HTMLElement>(`[data-board="${board}"]`);

/** Every platform's slot but `board`'s. */
export function slotsExcept(host: HTMLElement, board: number): Element[] {
  const slot = slotElement(host, board);
  return [...host.querySelectorAll('[data-board]')].filter((element) => element !== slot);
}

/** Duration and easing from the `--duration-zoom` and `--ease-zoom` tokens. */
export function zoomMotion(style: CSSStyleDeclaration | undefined): FlipOptions {
  const easing = style?.getPropertyValue('--ease-zoom').trim() ?? '';
  return {
    duration: Number.parseFloat(style?.getPropertyValue('--duration-zoom') ?? '') || 520,
    easing: easing.length > 0 ? easing : 'ease-in-out',
  };
}
