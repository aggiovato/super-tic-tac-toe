import { Component, input } from '@angular/core';
import type { TrainView } from './fleet-trains.model';

/**
 * A fleet as trains on a quay: each ship a train of flap coaches, one per cell. A hit coach turns
 * Sand; a sunk train drops to the wreck's tone, outlined. The rival's trains stay blank until sunk
 * (where it was hit is on the board, not here). Each ship reads as a list item for screen readers.
 */
@Component({
  selector: 'app-fleet-trains',
  templateUrl: './fleet-trains.html',
  styleUrl: './fleet-trains.css',
  host: { '[class.own]': 'own()' },
})
export class FleetTrains {
  readonly ships = input.required<readonly TrainView[]>();
  readonly label = input.required<string>();
  /** This player's own fleet: coaches in Seagrass, as its ships on the board. */
  readonly own = input(false);
}
