import type { ShipId } from '@fleet/core';

/** A ship in a fleet strip: a train of coaches, one per cell. */
export interface TrainView {
  readonly ship: ShipId;
  readonly length: number;
  /** Coaches hit (known only on this player's own ships; a rival ship shows its hits once sunk). */
  readonly hits: number;
  readonly sunk: boolean;
  /** One per coach, bow first: whether it is hit. */
  readonly coaches: readonly boolean[];
  /** Its accessible description. */
  readonly label: string;
}
