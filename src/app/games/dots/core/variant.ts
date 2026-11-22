import { sizeOf } from './engine';
import { DEFAULT_SIZE, type Size } from './models';

/** The size a game's variant names; an empty or unknown variant is the default board. */
export const sizeOfVariant = (variant: string): Size => sizeOf(variant) ?? DEFAULT_SIZE;

/** The variant that names `size`, as games and records store it. */
export const variantOf = (size: Size): string => String(size);
