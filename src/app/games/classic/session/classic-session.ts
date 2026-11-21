import { Injectable, type Provider } from '@angular/core';
import { chooseMove } from '@classic/ai';
import {
  applyMove,
  initialState,
  replay,
  RULES_VERSION,
  type GameState,
  type Move,
  type MoveResult,
  type RejectionReason,
} from '@classic/core';
import { GameSession, LocalOpponent, Opponent, type OpponentRequest } from '@match';

/** Every classic move is applied by its engine. */
@Injectable()
export class ClassicSession extends GameSession<GameState, Move, RejectionReason> {
  start(): GameState {
    return initialState();
  }

  play(state: GameState, move: Move): MoveResult {
    return applyMove(state, move);
  }
}

/** The classic opponent: a solved game, so it thinks on the main thread, at the usual pace. */
@Injectable()
export class ClassicOpponent extends LocalOpponent<Move> {
  protected choose({ moves, level, seed }: OpponentRequest<Move>): Move | null {
    const game = replay(moves, RULES_VERSION);
    return game.ok ? chooseMove(game.state, { level, seed }) : null;
  }
}

/** The classic route's session and opponent. */
export function provideClassicMatch(): Provider[] {
  return [
    { provide: GameSession, useClass: ClassicSession },
    { provide: Opponent, useClass: ClassicOpponent },
  ];
}
